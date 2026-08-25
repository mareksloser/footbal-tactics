<?php

declare(strict_types=1);

namespace App\Controller;

use App\Exception\ApiException;
use App\Repository\Contract\ShareRepositoryInterface;
use App\Repository\Contract\TacticRepositoryInterface;

readonly class TacticController
{
  public function __construct(
    private TacticRepositoryInterface $tacticRepo,
    private ShareRepositoryInterface $shareRepo
  ) {}

  public function list(): array
  {
    return $this->tacticRepo->listAll();
  }

  public function read(string $id): object
  {
    $tactic = $this->tacticRepo->findById($id);
    if (!$tactic) {
      throw new ApiException('Tactic not found', 404, 'not_found');
    }

    return $tactic;
  }

  public function save(object $body, bool $isNew): object
  {
    return $this->tacticRepo->save($body, $isNew);
  }

  public function delete(string $id): array
  {
    $this->tacticRepo->delete($id);
    http_response_code(204);

    return [];
  }

  public function createShare(string $id): array
  {
    $token = bin2hex(random_bytes(12));
    $this->shareRepo->createShare($token, $id);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    return ['token' => $token, 'url' => $origin . '/t/' . $id . '?share=' . $token];
  }

  public function readShared(string $token): object
  {
    $tacticId = $this->shareRepo->getTacticId($token);
    if (!$tacticId) {
      throw new ApiException('Link expired or invalid', 404, 'not_found');
    }

    return $this->read($tacticId);
  }
}