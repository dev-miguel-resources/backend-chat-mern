import { Request, Response } from 'express';
import {
  IJWT,
  LONG_PASSWORD,
  LONG_USERNAME,
  PASSWORD,
  USERNAME,
  WRONG_PASSWORD,
  WRONG_USERNAME,
  authMock,
  authMockRequest,
  authMockResponse
} from '@root/shared/globals/mocks/auth.mock';
import { SignIn } from '../signin';
import { CustomError } from '@helpers/errors/customError';
import { authService } from '@services/db/auth.service';
import { Generators } from '@helpers/generators/generators';

jest.useFakeTimers();

describe('SignInController', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should throw an error if username is not available', async () => {

    // GIVEN
    const req: Request = authMockRequest({}, { username: '', password: PASSWORD }) as Request;
    const res: Response = authMockResponse();

    // WHEN
    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

    // THEN
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('Should throw an error if password is not available', async () => {

    const req: Request = authMockRequest({}, { username: USERNAME, password: '' }) as Request;
    const res: Response = authMockResponse();

    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('Should throw an error if username is less than minimum length', async () => {

    const req: Request = authMockRequest({}, { username: WRONG_USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMockResponse();

    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if username is greater than maximum length', async () => {

    const req: Request = authMockRequest({}, { username: LONG_USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMockResponse();

    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid username');
    });
  });

  it('Should throw an error if password is less than minimum length', async () => {

    const req: Request = authMockRequest({}, { username: USERNAME, password: WRONG_PASSWORD }) as Request;
    const res: Response = authMockResponse();

    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw an error if password is greater than maximum length', async () => {

    const req: Request = authMockRequest({}, { username: USERNAME, password: LONG_PASSWORD }) as Request;
    const res: Response = authMockResponse();

    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('Should throw "Invalid credentials" if username does not exist', async () => {

    const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValueOnce(null!);
    await SignIn.prototype.read(req, res).catch((error: CustomError) => {

      expect(authService.getAuthUserByUsername).toHaveBeenCalledWith(
        Generators.firstLetterUppercase(req.body.username)
      );
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials');
    });
  });

  it('Should set session data for valid credentials and send correct json response for login successfully', async () => {

    const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }) as Request;
    const res: Response = authMockResponse();

    authMock.comparePassword = () => Promise.resolve(true);
    jest.spyOn(authService, 'getAuthUserByUsername').mockResolvedValue(authMock);
    await SignIn.prototype.read(req, res);

    expect(req.session?.jwt as IJWT).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User login successfully',
      user: authMock,
      token: req.session?.jwt
    });
  });
});
