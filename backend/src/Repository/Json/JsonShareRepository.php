<?php

declare(strict_types=1);

namespace App\Repository\Json;

use App\Repository\Contract\ShareRepositoryInterface;

readonly class JsonShareRepository implements ShareRepositoryInterface
{
  public function __construct(private string $storageDir) {}

  public function createShare(string $token, string $tacticId): void
  {
    $shares = $this->readJson('shares.json', []);
    $shares[$token] = $tacticId;
    $this->writeJson('shares.json', $shares);
  }

  public function getTacticId(string $token): ?string
  {
    $shares = $this->readJson('shares.json', []);

    return $shares[$token] ?? null;
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