import { Request, Response } from 'express';
import { SignUp } from '../signup';

import * as cloudinaryUploads from '@helpers/cloudinary/cloudinaryUploads';
import { userQueue } from '@services/queues/user.queue';
import { authQueue } from '@services/queues/auth.queue';
import { UserCache } from '@services/redis/user.cache';
import { IJWT, authMock, authMockRequest, imageMock } from '@root/shared/globals/mocks/auth.mock';
import { authMockResponse } from '@root/shared/globals/mocks/auth.mock';

import { CustomError } from '@helpers/errors/customError';
import { authService } from '@services/db/auth.service';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Iimage } from '@helpers/cloudinary/imageResult.interface';
jest.useFakeTimers();

jest.mock('@services/queues/base.queue'); // alternativa al prototype
jest.mock('@helpers/cloudinary/cloudinaryUploads');
jest.mock('@services/redis/user.cache');
jest.mock('@services/queues/user.queue');
jest.mock('@services/queues/auth.queue');

describe('SignUpController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('Should throw an error if username is not available', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        email: 'yorman@gmail.com',
        password: 'yordev',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username is a required field');
    });
  });

  it('Should throw an error if username length is less than minimum length', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'mau',
        email: 'manny@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username must be at least 4 characters');
    });
  });

  it('Should throw an error if username length is greater than maximum length', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'leodorosssss',
        email: 'yorman@gmail.com',
        password: 'yordev',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Username must be at most 8 characters');
    });
  });

  it('Should throw an error if email is not valid', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'yordev',
        email: 'asdadasdsasadas',
        password: 'yordev',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email must be valid');
    });
  });

  it('should throw an error if email is not available', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'yordev',
        email: '',
        password: 'yordev',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Email is a required field');
    });
  });

  it('should throw an error if password is not available', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'yordev',
        email: 'yormandev@gmail.com',
        password: '',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Password is a required field');
    });
  });

  it('should throw an error if password length is less than minimum length', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'yordev',
        email: 'yormandev@gmail.com',
        password: 'yo',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  it('should throw an error if password length is greater than maximum length', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'yordev',
        email: 'yormandev@gmail.com',
        password: 'yosadadadsadas',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid password');
    });
  });

  // INTEGRATION TEST
  it('Should throw unhatorize error is user already exist', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Yorman',
        email: 'yorman@gmail.com',
        password: 'yorpro',
        avatarColor: '#9c27b0',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock);
    await SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().message).toEqual('Invalid credentials for this user');
    });
  });

  it('Should set session data for valid credentials and send correct json response for user create successfully', async () => {
    const req: Request = authMockRequest(
      {},
      {
        username: 'Yorman',
        email: 'yorman@gmail.com',
        password: 'yorpro',
        avatarColor: '#9c27b0',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null!);
    jest
      .spyOn(cloudinaryUploads, 'uploads')
      .mockImplementation(() =>
        Promise.resolve<UploadApiResponse | UploadApiErrorResponse | undefined | Iimage>(imageMock)
      );
    const userSpy = jest.spyOn(UserCache.prototype, 'saveToUserCache');
    jest.spyOn(userQueue, 'addUserJob');
    jest.spyOn(authQueue, 'addAuthUserJob');

    await SignUp.prototype.create(req, res);

    expect(req.session?.jwt as IJWT).toBeDefined();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created successfully',
      user: userSpy.mock.calls[0][2],
      token: req.session?.jwt
    });
  });
});
