<?php

declare(strict_types=1);

namespace App\Repository\Json;

use App\Exception\ApiException;
use App\Repository\Contract\TacticRepositoryInterface;

readonly class JsonTacticRepository implements TacticRepositoryInterface
{
  public function __construct(private string $storageDir) {}

  public function listAll(): array
  {
    $result = [];
    $files = glob($this->storageDir . '/tactics/*.json') ?: [];

    foreach ($files as $file) {
      $tactic = json_decode(file_get_contents($file) ?: '{}', true);
      $result[] = [
        'id' => $tactic['id'] ?? null,
        'title' => $tactic['title'] ?? '',
        'description' => $tactic['description'] ?? null,
        'folderId' => $tactic['folderId'] ?? null,
        'tags' => $tactic['tags'] ?? [],
        'scenarioCount' => count($tactic['scenarios'] ?? []),
        'updatedAt' => $tactic['updatedAt'] ?? null,
      ];
    }

    return $result;
  }

  public function findById(string $id): ?object
  {
    $file = $this->storageDir . '/tactics/' . $this->safeId($id) . '.json';
    return is_file($file) ? json_decode(file_get_contents($file) ?: '{}') : null;
  }

  public function save(object $tactic, bool $isNew): object
  {
    $now = (new \DateTimeImmutable())->format(DATE_ATOM);
    $tactic->updatedAt = $now;

    if ($isNew) {
      $tactic->createdAt = $now;
    } else {
      // createdAt bereme z uloženého záznamu, ne od klienta
      $tactic->createdAt = $this->findById((string) $tactic->id)?->createdAt ?? $now;
    }

    $this->atomicWrite($this->storageDir . '/tactics/' . $this->safeId((string) $tactic->id) . '.json', $tactic);

    return $tactic;
  }

  public function delete(string $id): void
  {
    @unlink($this->storageDir . '/tactics/' . $this->safeId($id) . '.json');
  }

  private function safeId(string $id): string
  {
    if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) {
      throw new ApiException('Invalid ID format', 400, 'invalid_id');
    }

    return $id;
  }

  private function atomicWrite(string $file, mixed $data): void
  {
    if (!mkdir($concurrentDirectory = dirname($file), 0775, TRUE) && !is_dir($concurrentDirectory)) {
      throw new \RuntimeException(sprintf('Directory "%s" was not created', $concurrentDirectory));
    }

    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file);
  }
}