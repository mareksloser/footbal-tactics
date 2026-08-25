<?php

declare(strict_types=1);

namespace App;

use App\Controller\AuthController;
use App\Controller\FolderController;
use App\Controller\TacticController;
use App\Exception\ApiException;

readonly class Router
{
  public function __construct(
    private AuthController $authController,
    private FolderController $folderController,
    private TacticController $tacticController
  ) {}

  public function dispatch(string $method, array $segments, array $body): mixed
  {
    $resource = $segments[0] ?? '';
    $id = $segments[1] ?? null;
    $action = $segments[2] ?? null;

    return match (true) {
      $resource === 'auth' && $id === 'login' && $method === 'POST' => $this->authController->login($body),
      $resource === 'auth' && $id === 'logout' => $this->authController->logout(),

      $resource === 'folders' && $method === 'GET' => $this->folderController->list(),
      $resource === 'folders' && $method === 'POST' => $this->authController->requireAuth(fn () => $this->folderController->create($body)),
      $resource === 'folders' && $method === 'PATCH' => $this->authController->requireAuth(fn () => $this->folderController->update((string) $id, $body)),
      $resource === 'folders' && $method === 'DELETE' => $this->authController->requireAuth(fn () => $this->folderController->delete((string) $id)),

      $resource === 'tactics' && $method === 'GET' && $id === null => $this->tacticController->list(),
      $resource === 'tactics' && $method === 'GET' => $this->tacticController->read((string) $id),
      $resource === 'tactics' && $method === 'POST' && $id === null => $this->authController->requireAuth(fn () => $this->tacticController->save($body, true)),
      $resource === 'tactics' && $action === 'share' && $method === 'POST' => $this->authController->requireAuth(fn () => $this->tacticController->createShare((string) $id)),
      $resource === 'tactics' && $method === 'PUT' => $this->authController->requireAuth(fn () => $this->tacticController->save($body, false)),
      $resource === 'tactics' && $method === 'DELETE' => $this->authController->requireAuth(fn () => $this->tacticController->delete((string) $id)),

      $resource === 'shared' && $method === 'GET' => $this->tacticController->readShared((string) $id),

      default => throw new ApiException('Neznámý endpoint', 404, 'not_found'),
    };
  }
}