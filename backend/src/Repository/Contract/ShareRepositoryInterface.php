<?php

declare(strict_types=1);

namespace App\Repository\Contract;

interface ShareRepositoryInterface
{
  public function createShare(string $token, string $tacticId): void;
  public function getTacticId(string $token): ?string;
}