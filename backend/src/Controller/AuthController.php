<?php

declare(strict_types=1);

namespace App\Controller;

use App\Exception\ApiException;
use App\Repository\Contract\SessionRepositoryInterface;

readonly class AuthController
{
  public function __construct(
    private SessionRepositoryInterface $sessionRepo,
    private string $passwordHash
  ) {}

  public function login(object $body): array
  {
    $password = (string) ($body->password ?? '');
    if ($this->passwordHash === '' || !password_verify($password, $this->passwordHash)) {
      throw new ApiException('Incorrect password', 401, 'invalid_password');
    }

    $token = bin2hex(random_bytes(32));
    $expiresAt = (new \DateTimeImmutable('+12 hours'))->format(DATE_ATOM);

    $this->sessionRepo->createSession($token, $expiresAt);

    return ['token' => $token, 'expiresAt' => $expiresAt];
  }

  public function logout(): array
  {
    http_response_code(204);

    return [];
  }

  public function requireAuth(callable $handler): mixed
  {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_starts_with($header, 'Bearer ') ? substr($header, 7) : '';
    $expiresAt = $token !== '' ? $this->sessionRepo->getExpiration($token) : null;

    if ($token === '' || $expiresAt === null || strtotime($expiresAt) < time()) {
      throw new ApiException('Please log in again', 401, 'unauthorized');
    }

    return $handler();
  }
}