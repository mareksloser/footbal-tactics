<?php

declare(strict_types=1);

namespace App\Repository\Json;

use App\Repository\Contract\SessionRepositoryInterface;

readonly class JsonSessionRepository implements SessionRepositoryInterface
{
  public function __construct(private string $storageDir) {}

  public function createSession(string $token, string $expiresAt): void
  {
    $sessions = $this->readJson('sessions.json', []);
    $sessions[$token] = $expiresAt;
    $this->writeJson('sessions.json', $sessions);
  }

  public function getExpiration(string $token): ?string
  {
    $sessions = $this->readJson('sessions.json', []);

    return $sessions[$token] ?? null;
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