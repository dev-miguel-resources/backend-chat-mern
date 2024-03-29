import {
  JWT,
  PASSWORD,
  USERNAME,
  authMockRequest,
  authMockResponse,
  authUserPayload
} from '@root/shared/globals/mocks/auth.mock';
import { Request, Response } from 'express';
import { UserCache } from '@services/redis/user.cache';
import { existingUser } from '@root/shared/globals/mocks/user.mock';
import { CurrentUser } from '../currentUser';
import { IUserDocument } from '@user/interfaces/userDocument.interface';
import { userService } from '@services/db/user.service';

jest.mock('@services/redis/user.cache');
jest.mock('@services/db/user.service');

jest.useFakeTimers();

describe('CurrentUserController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Session Tokens CurrentUser', () => {

    it('Should send correct json response with token and user null and isUser false', async () => {

      const req: Request = authMockRequest({}, { username: USERNAME, password: PASSWORD }, authUserPayload) as Request;
      const res: Response = authMockResponse();

      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue({} as IUserDocument);
      await CurrentUser.prototype.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: null,
        isUser: false,
        user: null
      });
    });

    it('Should set session token and send correct json response from redis or mongo', async () => {

      const req: Request = authMockRequest(
        { jwt: JWT },
        { username: USERNAME, password: PASSWORD },
        authUserPayload
      ) as Request;
      const res: Response = authMockResponse();

      jest.spyOn(UserCache.prototype, 'getUserFromCache').mockResolvedValue(existingUser) ||
        jest.spyOn(userService, 'getUserById').mockResolvedValue(existingUser);
      await CurrentUser.prototype.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: req.session?.jwt,
        isUser: true,
        user: existingUser
      });
    });
  });
});
