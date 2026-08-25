<?php

declare(strict_types=1);

namespace App\Exception;

class ApiException extends \RuntimeException
{
  public function __construct(
    string $message,
    int $status,
    public readonly string $errorCode
  ) {
    parent::__construct($message, $status);
  }
}