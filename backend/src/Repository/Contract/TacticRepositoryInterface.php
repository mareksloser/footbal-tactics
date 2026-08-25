<?php

declare(strict_types=1);

namespace App\Repository\Contract;

interface TacticRepositoryInterface
{
  /**
   * Retrieve a list of all tactics formatted for list views.
   */
  public function listAll(): array;

  /**
   * Find a single tactic by its unique identifier.
   */
  public function findById(string $id): ?object;

  /**
   * Persist a tactic entity to storage.
   */
  public function save(object $tactic, bool $isNew): object;

  /**
   * Delete a tactic entry by its ID.
   */
  public function delete(string $id): void;
}