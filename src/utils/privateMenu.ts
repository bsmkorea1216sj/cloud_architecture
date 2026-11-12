/**
 * 개인 메뉴: 이 브라우저(localStorage)에만 저장되는 사이드바 링크.
 * 메뉴 이름과 주소는 저장소·배포 파일에 들어가지 않으며, 다른 사용자에게 보이지 않습니다.
 */
export interface PrivateMenuItem {
  week: number;
  label: string;
  href: string;
}

const KEY = 'ca.privateMenu.v1';
export const PRIVATE_MENU_EVENT = 'ca-private-menu-changed';

export function loadPrivateMenu(): PrivateMenuItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items)
      ? items.filter(
          (i) =>
            typeof i?.week === 'number' &&
            typeof i?.label === 'string' &&
            typeof i?.href === 'string' &&
            /^https:\/\//.test(i.href),
        )
      : [];
  } catch {
    return [];
  }
}

export function savePrivateMenu(items: PrivateMenuItem[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(PRIVATE_MENU_EVENT));
    return true;
  } catch {
    return false;
  }
}
