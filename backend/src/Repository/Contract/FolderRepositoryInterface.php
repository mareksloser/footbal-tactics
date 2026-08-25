<?php

declare(strict_types=1);

namespace App\Repository\Contract;

interface FolderRepositoryInterface
{
  public function listAll(): array;
  public function create(string $name, ?string $parentId): array;
  public function update(string $id, object $data): array;
  public function delete(string $id): void;
}