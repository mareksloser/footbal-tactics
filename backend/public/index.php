<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Env;
use App\Controller\AuthController;
use App\Controller\FolderController;
use App\Controller\TacticController;
use App\Exception\ApiException;
use App\Middleware\Cors;
use App\Repository\Json\JsonFolderRepository;
use App\Repository\Json\JsonSessionRepository;
use App\Repository\Json\JsonShareRepository;
use App\Repository\Json\JsonTacticRepository;
use App\Router;

$rootDir = dirname(__DIR__);

// --- ENV ---
$dotenv = Dotenv\Dotenv::createImmutable($rootDir);
$dotenv->safeLoad();
$dotenv->required(['AUTH_PASSWORD_HASH', 'CORS_ORIGINS'])->notEmpty();

// --- ERROR HANDLING ---
$debug = Env::bool('APP_DEBUG');
ini_set('log_errors', '1');
ini_set('error_log', Env::path('ERROR_LOG', $rootDir, 'tmp/error/api--php-error.log'));
ini_set('display_errors', $debug ? '1' : '0');

// --- HANDLE CORS ---
$cors = new Cors(Env::list('CORS_ORIGINS'));
$cors->handle();

header('Content-Type: application/json; charset=utf-8');

define('STORAGE_DIR', Env::path('STORAGE_DIR', $rootDir, 'storage'));

// --- REPOSITORY INITIALIZATION ---
$tacticRepo  = new JsonTacticRepository(STORAGE_DIR);
$folderRepo  = new JsonFolderRepository(STORAGE_DIR);
$sessionRepo = new JsonSessionRepository(STORAGE_DIR);
$shareRepo   = new JsonShareRepository(STORAGE_DIR);

/*
 * MYSQL / SQLITE SWITCH:
 * $pdo = new PDO(Env::get('DB_DSN'), Env::get('DB_USER'), Env::get('DB_PASSWORD'));
 * $tacticRepo = new \App\Repository\Pdo\PdoTacticRepository($pdo);
 */

// --- CONTROLLERS ---
$authController   = new AuthController($sessionRepo, Env::get('AUTH_PASSWORD_HASH'));
$folderController = new FolderController($folderRepo);
$tacticController = new TacticController($tacticRepo, $shareRepo);

$router = new Router($authController, $folderController, $tacticController);

// --- REQUEST HANDLING ---
$method = $_SERVER['REQUEST_METHOD'];
$path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '', '/');
$segments = $path === '' ? [] : explode('/', $path);

if (($segments[0] ?? '') === 'api') {
  array_shift($segments);
}

$body = json_decode(file_get_contents('php://input') ?: '{}') ?? new \stdClass();

try {
  $response = $router->dispatch($method, $segments, $body);
  if (http_response_code() !== 204) {
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
  }
} catch (ApiException $e) {
  http_response_code($e->getCode());
  echo json_encode([
    'error' => [
      'code' => $e->errorCode,
      'message' => $e->getMessage(),
    ],
  ], JSON_UNESCAPED_UNICODE);
} catch (\Throwable $e) {
  error_log((string) $e);
  http_response_code(500);
  echo json_encode([
    'error' => [
      'code' => 'server_error',
      'message' => $debug ? $e->getMessage() : 'Interní chyba serveru',
    ],
  ], JSON_UNESCAPED_UNICODE);
}