<?php

declare(strict_types=1);

namespace App\Repository\Pdo;

use App\Exception\ApiException;
use App\Repository\Contract\TacticRepositoryInterface;

readonly class PdoTacticRepository implements TacticRepositoryInterface
{
  public function __construct(private \PDO $pdo) {}

  public function listAll(): array
  {
    // Query compatible with MySQL (using JSON functions)
    $stmt = $this->pdo->query('
            SELECT id, title, description, folder_id AS folderId, tags,
                   JSON_LENGTH(data->"$.scenarios") AS scenarioCount, updated_at AS updatedAt
            FROM tactics
        ');

    $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
      $row['tags'] = json_decode($row['tags'] ?? '[]', true);
      $row['scenarioCount'] = (int) $row['scenarioCount'];
    }

    return $rows;
  }

  public function findById(string $id): ?object
  {
    $stmt = $this->pdo->prepare('SELECT data FROM tactics WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);

    // Bez druheho parametru → prazdny objekt zustane stdClass, ne polem.
    return $row ? json_decode($row['data']) : null;
  }

  public function save(object $tactic, bool $isNew): object
  {
    $id = (string) ($tactic->id ?? '');
    if ($id === '') {
      throw new ApiException('Missing tactic ID', 400, 'invalid_id');
    }

    $existing = $this->findById($id);

    if (!$isNew && $existing === null) {
      throw new ApiException('Tactic not found', 404, 'not_found');
    }

    $now = (new \DateTimeImmutable())->format(DATE_ATOM);
    $tactic->updatedAt = $now;
    $tactic->createdAt = $isNew ? $now : ($existing->createdAt ?? $now);

    // Upsert query for MySQL
    $stmt = $this->pdo->prepare('
            INSERT INTO tactics (id, title, description, folder_id, tags, data, updated_at)
            VALUES (:id, :title, :description, :folder_id, :tags, :data, :updated_at)
            ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                description = VALUES(description),
                folder_id = VALUES(folder_id),
                tags = VALUES(tags),
                data = VALUES(data),
                updated_at = VALUES(updated_at)
        ');

    $stmt->execute([
      'id' => $id,
      'title' => $tactic->title ?? '',
      'description' => $tactic->description ?? null,
      'folder_id' => $tactic->folderId ?? null,
      'tags' => json_encode($tactic->tags ?? [], JSON_UNESCAPED_UNICODE),
      'data' => json_encode($tactic, JSON_UNESCAPED_UNICODE),
      'updated_at' => $now,
    ]);

    return $tactic;
  }

  public function delete(string $id): void
  {
    $stmt = $this->pdo->prepare('DELETE FROM tactics WHERE id = :id');
    $stmt->execute(['id' => $id]);
  }
}