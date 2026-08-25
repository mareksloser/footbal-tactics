<?php

declare(strict_types=1);

namespace App\Repository\Json;

use App\Exception\ApiException;
use App\Repository\Contract\FolderRepositoryInterface;

readonly class JsonFolderRepository implements FolderRepositoryInterface
{
  public function __construct(private string $storageDir) {}

  public function listAll(): array
  {
    return $this->readJson('folders.json', []);
  }

  public function create(string $name, ?string $parentId): array
  {
    $folders = $this->readJson('folders.json', []);
    $folder = [
      'id' => 'fd_' . bin2hex(random_bytes(5)),
      'name' => $name,
      'parentId' => $parentId,
    ];
    $folders[] = $folder;
    $this->writeJson('folders.json', $folders);

    return $folder;
  }

  public function update(string $id, object $data): array
  {
    $folders = $this->readJson('folders.json', []);
    foreach ($folders as &$folder) {
      if ($folder['id'] === $id) {
        $folder['name'] = $data->name ?? $folder['name'];
        $folder['parentId'] = property_exists($data, 'parentId') ? $data->parentId : $folder['parentId'];
        $this->writeJson('folders.json', $folders);

        return $folder;
      }
    }

    throw new ApiException('Folder not found', 404, 'not_found');
  }

  public function delete(string $id): void
  {
    $folders = array_values(array_filter(
      $this->readJson('folders.json', []),
      fn (array $folder) => $folder['id'] !== $id
    ));
    $this->writeJson('folders.json', $folders);
  }

  private function readJson(string $filename, mixed $fallback): mixed
  {
    $file = $this->storageDir . '/' . $filename;
    if (!is_file($file)) {
      return $fallback;
    }

    return json_decode(file_get_contents($file) ?: 'null', true) ?? $fallback;
  }

  private function writeJson(string $filename, mixed $data): void
  {
    $file = $this->storageDir . '/' . $filename;
    @mkdir(dirname($file), 0775, true);
    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file);
  }
}