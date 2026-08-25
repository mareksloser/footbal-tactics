<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\Contract\FolderRepositoryInterface;

readonly class FolderController
{
  public function __construct(private FolderRepositoryInterface $folderRepo) {}

  public function list(): array
  {
    return $this->folderRepo->listAll();
  }

  public function create(object $body): array
  {
    return $this->folderRepo->create(
      (string) ($body->name ?? ''),
      $body->parentId ?? null
    );
  }

  public function update(string $id, object $body): array
  {
    return $this->folderRepo->update($id, $body);
  }

  public function delete(string $id): array
  {
    $this->folderRepo->delete($id);
    http_response_code(204);

    return [];
  }
}