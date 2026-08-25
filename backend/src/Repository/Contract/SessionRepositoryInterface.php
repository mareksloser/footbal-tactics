<?php

declare(strict_types=1);

namespace App\Repository\Contract;

interface SessionRepositoryInterface
{
  public function createSession(string $token, string $expiresAt): void;
  public function getExpiration(string $token): ?string;
}