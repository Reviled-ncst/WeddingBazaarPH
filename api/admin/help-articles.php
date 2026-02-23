<?php
/**
 * Admin Help Articles API
 * GET: List articles
 * POST: Create article
 * PUT: Update article
 * DELETE: Delete article
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

$pdo = getDBConnection();

// Public access for GET, admin required for modifications
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $user = getAuthUser();
    if (!$user || $user['role'] !== 'admin') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $articleId = $_GET['id'] ?? null;
    $slug = $_GET['slug'] ?? null;
    $category = $_GET['category'] ?? null;
    $search = $_GET['search'] ?? null;

    try {
        // Get single article
        if ($articleId || $slug) {
            $sql = "SELECT ha.*, u.name as author_name FROM help_articles ha LEFT JOIN users u ON ha.author_id = u.id WHERE ";
            $param = null;
            if ($articleId) {
                $sql .= "ha.id = ?";
                $param = $articleId;
            } else {
                $sql .= "ha.slug = ?";
                $param = $slug;
            }
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$param]);
            $article = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$article) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Article not found']);
                exit;
            }

            // Increment view count
            $pdo->prepare("UPDATE help_articles SET view_count = view_count + 1 WHERE id = ?")->execute([$article['id']]);

            $article['tags'] = $article['tags'] ? json_decode($article['tags'], true) : [];
            echo json_encode(['success' => true, 'article' => $article]);
            exit;
        }

        // List articles
        $sql = "SELECT ha.*, u.name as author_name FROM help_articles ha LEFT JOIN users u ON ha.author_id = u.id WHERE 1=1";
        $params = [];

        if ($category) {
            $sql .= " AND ha.category = ?";
            $params[] = $category;
        }

        if ($search) {
            $sql .= " AND (ha.title LIKE ? OR ha.content LIKE ? OR ha.excerpt LIKE ?)";
            $searchTerm = "%$search%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
        }

        // Only show published for non-admin
        $user = getAuthUser();
        if (!$user || $user['role'] !== 'admin') {
            $sql .= " AND ha.is_published = 1";
        }

        $sql .= " ORDER BY ha.category, ha.title";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($articles as &$article) {
            $article['tags'] = $article['tags'] ? json_decode($article['tags'], true) : [];
        }

        // Get categories
        $stmt = $pdo->query("SELECT DISTINCT category FROM help_articles ORDER BY category");
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);

        echo json_encode([
            'success' => true,
            'articles' => $articles,
            'categories' => $categories
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $required = ['category', 'title', 'content'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "$field is required"]);
            exit;
        }
    }

    try {
        // Generate slug
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $input['title']));
        $slug = trim($slug, '-');
        
        // Ensure unique slug
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM help_articles WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetchColumn() > 0) {
            $slug .= '-' . time();
        }

        $stmt = $pdo->prepare("
            INSERT INTO help_articles (category, title, slug, content, excerpt, tags, is_published, author_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['category'],
            $input['title'],
            $slug,
            $input['content'],
            $input['excerpt'] ?? null,
            isset($input['tags']) ? json_encode($input['tags']) : null,
            $input['is_published'] ?? true,
            $user['id']
        ]);

        echo json_encode(['success' => true, 'message' => 'Article created', 'id' => $pdo->lastInsertId()]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $articleId = $input['id'] ?? null;

    if (!$articleId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Article ID required']);
        exit;
    }

    try {
        $updates = [];
        $params = [];
        $allowedFields = ['category', 'title', 'content', 'excerpt', 'is_published'];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (isset($input['tags'])) {
            $updates[] = "tags = ?";
            $params[] = json_encode($input['tags']);
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No updates provided']);
            exit;
        }

        $params[] = $articleId;
        $sql = "UPDATE help_articles SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => 'Article updated']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $articleId = $_GET['id'] ?? null;

    if (!$articleId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Article ID required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM help_articles WHERE id = ?");
        $stmt->execute([$articleId]);

        echo json_encode(['success' => true, 'message' => 'Article deleted']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
