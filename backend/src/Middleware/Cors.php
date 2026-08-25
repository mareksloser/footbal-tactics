<?php

declare(strict_types=1);

namespace App\Middleware;

readonly class Cors
{
  /**
   * @param string[] $allowedOrigins
   */
  public function __construct(
    private array $allowedOrigins = []
  ) {}

  /**
   * Handle CORS headers and preflight OPTIONS request.
   */
  public function handle(): void
  {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $this->allowedOrigins, true)) {
      header("Access-Control-Allow-Origin: {$origin}");
      header('Access-Control-Allow-Credentials: true');
      header('Access-Control-Max-Age: 86400');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
      }

      if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
      } else {
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
      }

      http_response_code(204);
      exit;
    }
  }
}