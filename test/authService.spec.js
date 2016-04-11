import {Container} from 'aurelia-dependency-injection';
import {Config, Rest} from 'aurelia-api';

import {configure} from '../src/aurelia-authentication';
import {AuthService} from '../src/aurelia-authentication';
import {BaseConfig} from '../src/baseConfig';
import {Authentication} from '../src/authentication';

const noop = () => {};

function getContainer() {
  const container = new Container();
  const config    = container.get(Config);

  config
    .registerEndpoint('sx/default', 'http://localhost:1927/')
    .registerEndpoint('sx/custom', 'http://localhost:1927/custom')
    .setDefaultEndpoint('sx/default');

  configure({container: container, globalResources: noop}, {
    endpoint: '',
    loginRedirect: false,
    logoutRedirect: false,
    signupRedirect: false,
    baseUrl: 'http://localhost:1927/'
  });

  return container;
}


describe('AuthService', () => {
  describe('.client', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);
    it('to be instanceof HttpClient', () => {
      expect(authService.client instanceof Rest).toBe(true);
    });
  });


  describe('.getMe()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('without criteria', done => {
      authService.getMe()
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          done();
        });
    });

    it('with criteria a number', done => {
      authService.getMe(5)
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('5');
          done();
        });
    });

    it('with criteria a string', done => {
      authService.getMe('five')
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('five');
          done();
        });
    });

    it('with criteria an object', done => {
      authService.getMe({foo: 'bar'})
        .then(result => {
          expect(result.method).toBe('GET');
          expect(result.path).toBe('/auth/me');
          expect(result.query.foo).toBe('bar');
          done();
        });
    });
  });


  describe('.updateMe()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('without criteria', done => {
      authService.updateMe({data: 'some'})
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(JSON.stringify(result.query)).toBe('{}');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria a number', done => {
      authService.updateMe({data: 'some'}, 5)
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('5');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria a string', done => {
      authService.updateMe({data: 'some'}, 'five')
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(result.query.id).toBe('five');
          expect(result.body.data).toBe('some');
          done();
        });
    });

    it('with criteria an object', done => {
      authService.updateMe({data: 'some'}, {foo: 'bar'})
        .then(result => {
          expect(result.method).toBe('PUT');
          expect(result.path).toBe('/auth/me');
          expect(result.query.foo).toBe('bar');
          expect(result.body.data).toBe('some');
          done();
        });
    });
  });


  describe('.getAccessToken()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.accessToken', () => {
      authService.authentication.accessToken = 'some';

      const token = authService.getAccessToken();

      expect(token).toBe('some');
    });
  });


  describe('.getRefreshToken()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.refreshToken', () => {
      authService.authentication.refreshToken = 'some other';

      const token = authService.getRefreshToken();

      expect(token).toBe('some other');
    });
  });


  describe('.isAuthenticated()', () => {
    const container      = getContainer();
    const authentication = container.get(Authentication);
    const baseConfig     = container.get(BaseConfig);
    const authService    = container.get(AuthService);

    afterEach(done => {
      authService.logout().then(done);
      baseConfig.autoUpdateToken = false;
    });

    it('should return boolean', () => {
      const result = authService.isAuthenticated();

      expect(typeof result).toBe('boolean');
    });

    it('should return Promise<boolean>', done => {
      const result = authService.isAuthenticated(true);

      expect(result instanceof Promise).toBe(true);
      result.then(authenticated => {
        expect(typeof authenticated).toBe('boolean');
        done();
      });
    });

    describe('with autoUpdateToken=true', () => {
      it('should return boolean true', () => {
        baseConfig.autoUpdateToken  = true;
        authentication.accessToken  = 'outdated';
        authentication.refreshToken = 'some';

        spyOn(authService, 'updateToken').and.returnValue(Promise.resolve(false));
        spyOn(authentication, 'isAuthenticated').and.returnValue(false);

        const result = authService.isAuthenticated();

        expect(typeof result).toBe('boolean');
        expect(result).toBe(true);
      });

      it('should return Promise<true>', done => {
        baseConfig.autoUpdateToken  = true;
        authentication.accessToken  = 'outdated';
        authentication.refreshToken = 'some';

        spyOn(authService, 'updateToken').and.returnValue(Promise.resolve(true));
        spyOn(authentication, 'isAuthenticated').and.returnValue(false);

        const result = authService.isAuthenticated(true);

        expect(result instanceof Promise).toBe(true);
        result.then(authenticated => {
          expect(typeof authenticated).toBe('boolean');
          expect(authenticated).toBe(true);
          done();
        });
      });
    });
  });


  describe('.isTokenExpired()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.isTokenExpired() result', () => {
      spyOn(authService.authentication, 'isTokenExpired').and.returnValue('expired');

      const expired = authService.isTokenExpired();

      expect(expired).toBe('expired');
    });
  });


  describe('.getTokenPayload()', () => {
    const container      = getContainer();
    const authService    = container.get(AuthService);

    it('should return authentication.getTokenPayload() result ', () => {
      spyOn(authService.authentication, 'getTokenPayload').and.returnValue('payload');

      const payload = authService.getTokenPayload();

      expect(payload).toBe('payload');
    });
  });


  describe('.updateToken()', () => {
    const container      = new Container();
    const authService = container.get(AuthService);

    afterEach(done => {
      authService.logout().then(done);
    });

    it('fail without refreshToken', done => {
      authService.updateToken()
      .catch(error => {
        expect(error instanceof Error).toBe(true);
        done();
      });
    });

    it('fail on no token in response', done => {
      authService.authentication.accessToken = null;
      authService.authentication.refreshToken = 'some';
      authService.config.client = {
        post: () => Promise.resolve({Error: 'serverError'})
      };

      authService.updateToken()
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.authentication.isAuthenticated()).toBe(false);
          done();
        });
    });

    it('fail with same response if called several times', done => {
      authService.authentication.accessToken = null;
      authService.authentication.refreshToken = 'some';
      authService.config.client = {
        post: () => Promise.resolve({Error: 'no token'})
      };

      authService.updateToken()
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.authentication.isAuthenticated()).toBe(false);
        });

      authService.config.client = {
        post: () => Promise.resolve({token: 'valid token'})
      };

      authService.updateToken()
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.authentication.isAuthenticated()).toBe(false);
          done();
        });
    });

    it('get new accessToken', done => {
      authService.authentication.accessToken = null;
      authService.authentication.refreshToken = 'some';
      authService.config.client = {
        post: () => Promise.resolve({token: 'newToken'})
      };

      authService.updateToken()
      .then(res => {
        expect(authService.authentication.isAuthenticated()).toBe(true);
        expect(authService.authentication.accessToken).toBe('newToken');
        done();
      });
    });

    it('get same new accessToken if called several times', done => {
      authService.authentication.accessToken = null;
      authService.authentication.refreshToken = 'some';
      authService.config.client = {
        post: () => Promise.resolve({token: 'newToken'})
      };

      authService.updateToken()
      .then(res => {
        expect(authService.authentication.isAuthenticated()).toBe(true);
        expect(authService.authentication.accessToken).toBe('newToken');
      });

      authService.config.client = {
        post: () => Promise.resolve({token: 'other newToken'})
      };
      authService.updateToken()
        .then(res => {
          expect(authService.authentication.isAuthenticated()).toBe(true);
          expect(authService.authentication.accessToken).toBe('newToken');
          done();
        });
    });
  });


  describe('.signup()', () => {
    const container = getContainer();
    const authService = container.get(AuthService);

    afterEach(done => {
      authService.logout().then(done);
    });

    it('Should try to signup with signup data object and fail.', done => {
      authService.signup({user: 'some'})
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.isAuthenticated()).toBe(false);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });

    it('Should signup with signup data object and not login.', done => {
      authService.config.loginOnSignup = false;

      authService.signup({user: 'some', access_token: 'aToken'})
        .then(response => {
          expect(response.path).toBe('/auth/signup');
          expect(response.body.user).toBe('some');
          expect(authService.isAuthenticated()).toBe(false);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });

    it('Should signup with signup data object and login.', done => {
      authService.config.loginOnSignup = true;

      authService.signup({user: 'some', access_token: 'aToken'})
        .then(response => {
          expect(response.path).toBe('/auth/signup');
          expect(response.body.user).toBe('some');
          expect(authService.getAccessToken()).toBe('aToken');
          expect(authService.isAuthenticated()).toBe(true);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });
  });

  describe('.login()', () => {
    const container = getContainer();
    const authService = container.get(AuthService);

    afterEach(done => {
      authService.logout().then(done);
    });

    it('Should try to login with login data object and fail.', done => {
      authService.login({user: 'some'})
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.isAuthenticated()).toBe(false);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });

    it('Should login with login data object.', done => {
      authService.login({user: 'some', access_token: 'aToken'})
        .then(response => {
          expect(response.path).toBe('/auth/login');
          expect(response.body.user).toBe('some');
          expect(authService.getAccessToken()).toBe('aToken');
          expect(authService.isAuthenticated()).toBe(true);

          expect(authService.getRefreshToken()).toBe(null);
          authService.updateToken()
            .catch(err => {
              expect(err instanceof Error).toBe(true);
              done();
            });
        });
    });
  });


  describe('.logout()', () => {
    const container      = getContainer();
    const authService = container.get(AuthService);

    authService.authentication.accessToken = 'some';
    authService.config.logoutRedirect = 'nowhere';

    it('Should logout and not redirect.', done => {
      authService.logout(false)
        .then(() => {
          expect(authService.isAuthenticated()).toBe(false);
          authService.config.logoutRedirect = null;
          done();
        });
    });
  });


  describe('.authenticate()', () => {
    const container      = getContainer();
    const authentication = container.get(Authentication);
    const baseConfig     = container.get(BaseConfig);

    authentication.oAuth1.open = (provider, userData) => Promise.resolve({
      provider: provider,
      userData: userData,
      access_token: 'oauth1'
    });

    authentication.oAuth2.open = (provider, userData) => Promise.resolve({
      provider: provider,
      userData: userData,
      access_token: 'oauth2'
    });

    afterEach(done => {
      const authService = container.get(AuthService);
      authService.config.loginRedirect = null;
      authService.logout().then(done);
    });

    it('Should authenticate with oAuth1 provider, login and not redirect.', done => {
      const authService = new AuthService(authentication, baseConfig);
      spyOn(authentication.oAuth1, 'open').and.callThrough();
      authService.config.loginRedirect = 'nowhere';

      authService.authenticate('twitter', false, {data: 'some'})
        .then(response => {
          expect(response.provider).toBe(baseConfig.providers['twitter']);
          expect(response.userData.data).toBe('some');
          expect(response.access_token).toBe('oauth1');

          expect(authService.getAccessToken()).toBe('oauth1');
          expect(authService.getTokenPayload()).toBe(null);
          expect(authService.isTokenExpired()).toBe(undefined);
          expect(authService.isAuthenticated()).toBe(true);
          done();
        });
    });

    it('Should authenticate with oAuth2 provider, login and not redirect.', done => {
      const authService = new AuthService(authentication, baseConfig);
      spyOn(authentication.oAuth2, 'open').and.callThrough();
      authService.config.loginRedirect = null;

      authService.authenticate('facebook', null, {data: 'some'})
        .then(response => {
          expect(response.provider).toBe(baseConfig.providers['facebook']);
          expect(response.userData.data).toBe('some');
          expect(response.access_token).toBe('oauth2');

          expect(authService.getAccessToken()).toBe('oauth2');
          expect(authService.getTokenPayload()).toBe(null);
          expect(authService.isTokenExpired()).toBe(undefined);
          expect(authService.isAuthenticated()).toBe(true);
          done();
        });
    });

    it('Should try to authenticate with and fail.', done => {
      const authService = new AuthService(authentication, baseConfig);
      spyOn(authentication.oAuth2, 'open').and.returnValue(Promise.resolve());

      authService.authenticate('facebook')
        .catch(error => {
          expect(error instanceof Error).toBe(true);
          expect(authService.getAccessToken()).toBe(null);
          expect(authService.getTokenPayload()).toBe(null);
          expect(authService.isTokenExpired()).toBe(undefined);
          expect(authService.isAuthenticated()).toBe(false);

          done();
        });
    });
  });


  describe('.unlink()', () => {
    const container = getContainer();
    const authService = container.get(AuthService);

    it('Should unlink provider.', done => {
      authService.unlink('some')
        .then(response => {
          expect(response.method).toBe('GET');
          expect(response.path).toBe('/auth/unlink/some');
          done();
        });
    });

    it('Should unlink provider using POST.', done => {
      authService.config.unlinkMethod = 'post';

      authService.unlink('some')
        .then(response => {
          expect(response.method).toBe('POST');
          expect(response.path).toBe('/auth/unlink/some');
          done();
        });
    });
  });
});
