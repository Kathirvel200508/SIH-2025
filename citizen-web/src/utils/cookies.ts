// Cookie utility functions for authentication

export function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function setAuthCookie(token: string, userRole: string, userId: string, username: string) {
  setCookie('auth_token', token, 7); // 7 days
  setCookie('user_role', userRole, 7);
  setCookie('user_id', userId, 7);
  setCookie('username', username, 7);
}

export function getAuthFromCookie(): { token: string | null; role: string | null; userId: string | null; username: string | null } {
  return {
    token: getCookie('auth_token'),
    role: getCookie('user_role'),
    userId: getCookie('user_id'),
    username: getCookie('username')
  };
}

export function clearAuthCookie() {
  deleteCookie('auth_token');
  deleteCookie('user_role');
  deleteCookie('user_id');
  deleteCookie('username');
}

