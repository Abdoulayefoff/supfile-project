<?php

namespace App\Tests\Functional\Controller;

use App\Tests\Functional\AbstractFunctionalTest;

/**
 * Tests fonctionnels pour AuthController.
 *
 * Couverture :
 *   Happy path    : register succès, login succès
 *   Validation    : email manquant, password manquant, email invalide, password < 8 chars
 *   Sécurité OWASP: email déjà pris (A01), mauvais password → 401 (A07)
 */
class AuthControllerTest extends AbstractFunctionalTest
{
    // POST /api/auth/register — Happy Path
    public function testRegisterSuccessReturns201WithTokenAndUser(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'newuser@example.com',
            'password' => 'password123',
            'consent'  => true,
        ]);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('token', $data);
        $this->assertArrayHasKey('user', $data);
        $this->assertSame('newuser@example.com', $data['user']['email']);
    }

    public function testRegisterWithFirstNameAndLastNameReturnsUserData(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'     => 'abdoulaye@example.com',
            'password'  => 'password123',
            'firstName' => 'Abdoulaye',
            'lastName'  => 'FOFANA',
            'consent'   => true,
        ]);

        $this->assertSame(201, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertSame('Abdoulaye', $data['user']['firstName']);
        $this->assertSame('FOFANA', $data['user']['lastName']);
    }

    public function testRegisterReturnsQuotaFields(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'quota@example.com',
            'password' => 'securepass',
            'consent'  => true,
        ]);

        $data = $this->getResponseData();
        $this->assertArrayHasKey('quotaUsed', $data['user']);
        $this->assertArrayHasKey('quotaLimit', $data['user']);
    }

    // POST /api/auth/register — Validation
    public function testRegisterWithoutEmailReturns400(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'password' => 'password123',
        ]);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testRegisterWithoutPasswordReturns400(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email' => 'test@example.com',
        ]);

        $this->assertSame(400, $this->getStatusCode());
    }

    public function testRegisterWithInvalidEmailFormatReturns400(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'not-an-email',
            'password' => 'password123',
        ]);

        $this->assertSame(400, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    public function testRegisterWithPasswordShorterThan8CharsReturns400(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'short@example.com',
            'password' => '1234567',
        ]);

        $this->assertSame(400, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    public function testRegisterWithEmptyBodyReturns400(): void
    {
        $this->publicJson('POST', '/api/auth/register', []);

        $this->assertSame(400, $this->getStatusCode());
    }

    // POST /api/auth/register — Sécurité OWASP A01 / Email déjà pris
    public function testRegisterWithAlreadyUsedEmailReturns409(): void
    {
        $this->createUser('existing@example.com', 'password123');

        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'existing@example.com',
            'password' => 'anotherpassword',
            'consent'  => true,
        ]);

        $this->assertSame(409, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    // POST /api/auth/register — Cas limites
    public function testRegisterWithExactly8CharsPasswordSucceeds(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'exact8@example.com',
            'password' => '12345678',
            'consent'  => true,
        ]);

        $this->assertSame(201, $this->getStatusCode());
    }

    public function testRegisterWithEmailContainingUppercaseSucceeds(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'Upper@Example.COM',
            'password' => 'password123',
            'consent'  => true,
        ]);

        // Le contrôleur utilise filter_var qui accepte les majuscules
        $this->assertSame(201, $this->getStatusCode());
    }

    // POST /api/auth/register — Consentement RGPD
    public function testRegisterWithoutConsentReturns422(): void
    {
        $this->publicJson('POST', '/api/auth/register', [
            'email'    => 'noconsent@example.com',
            'password' => 'password123',
        ]);

        $this->assertSame(422, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('error', $data);
    }

    // POST /api/auth/login — Happy Path
    public function testLoginWithValidCredentialsReturns200WithToken(): void
    {
        $this->createUser('login@example.com', 'password123');

        $this->client->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'login@example.com', 'password' => 'password123'])
        );

        $this->assertSame(200, $this->getStatusCode());
        $data = $this->getResponseData();
        $this->assertArrayHasKey('token', $data);
        $this->assertNotEmpty($data['token']);
    }

    // POST /api/auth/login — Sécurité OWASP A07
    public function testLoginWithWrongPasswordReturns401(): void
    {
        $this->createUser('secureuser@example.com', 'realpassword');

        $this->client->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'secureuser@example.com', 'password' => 'wrongpassword'])
        );

        $this->assertSame(401, $this->getStatusCode());
    }

    public function testLoginWithUnknownEmailReturns401(): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['email' => 'nobody@example.com', 'password' => 'anypassword'])
        );

        $this->assertSame(401, $this->getStatusCode());
    }

    public function testProtectedRouteWithoutTokenReturns401(): void
    {
        $this->client->request('GET', '/api/user/me');
        $this->assertSame(401, $this->getStatusCode());
    }
}
