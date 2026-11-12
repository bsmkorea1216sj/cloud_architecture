import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
  Table,
} from '@cloudscape-design/components';
import {
  loadPrivateMenu,
  savePrivateMenu,
  PrivateMenuItem,
} from '@/utils/privateMenu';

/** 이 브라우저에만 저장되는 개인 사이드바 링크를 등록·삭제하는 화면 (메뉴에는 노출하지 않음) */
export const PrivateMenu: React.FC = () => {
  const [items, setItems] = useState<PrivateMenuItem[]>(loadPrivateMenu());
  const [week, setWeek] = useState('5');
  const [label, setLabel] = useState('');
  const [href, setHref] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const weekNum = parseInt(week, 10);
  const valid =
    weekNum >= 1 && weekNum <= 15 && label.trim() !== '' && /^https:\/\//.test(href.trim());

  const persist = (next: PrivateMenuItem[], msg: string) => {
    if (savePrivateMenu(next)) {
      setItems(next);
      setMessage(msg);
    } else {
      setMessage('이 브라우저에서는 저장할 수 없습니다 (시크릿 창 또는 저장소 차단).');
    }
  };

  return (
    <SpaceBetween size="l">
      <Container header={<Header variant="h1">개인 메뉴 설정</Header>}>
        <SpaceBetween size="m">
          <Alert type="info">
            여기서 추가한 링크는 <b>이 브라우저에만</b> 저장되어 사이드바의 해당 주차 아래에 표시됩니다.
            사이트 코드와 다른 사용자 화면에는 나타나지 않습니다. 링크 대상의 접근 권한(예: 비공개 Google 문서)은 그 서비스에서 관리합니다.
          </Alert>
          {message && <Alert type="success" dismissible onDismiss={() => setMessage(null)}>{message}</Alert>}
          <Form
            actions={
              <Button
                variant="primary"
                disabled={!valid}
                onClick={() => {
                  persist(
                    [...items, { week: weekNum, label: label.trim(), href: href.trim() }],
                    '추가했습니다. 사이드바에서 확인하세요.',
                  );
                  setLabel('');
                  setHref('');
                }}
              >
                추가
              </Button>
            }
          >
            <SpaceBetween size="s">
              <FormField label="주차 (1–15)">
                <Input type="number" value={week} onChange={(e) => setWeek(e.detail.value)} />
              </FormField>
              <FormField label="메뉴 이름" description="예: 🔒 5-4. 개인 자료">
                <Input value={label} onChange={(e) => setLabel(e.detail.value)} />
              </FormField>
              <FormField label="링크 주소 (https://)">
                <Input value={href} onChange={(e) => setHref(e.detail.value)} />
              </FormField>
            </SpaceBetween>
          </Form>
        </SpaceBetween>
      </Container>
      <Table
        header={<Header variant="h2">이 브라우저의 개인 메뉴</Header>}
        items={items}
        empty={<Box textAlign="center">등록된 개인 메뉴가 없습니다.</Box>}
        columnDefinitions={[
          { id: 'week', header: '주차', cell: (i) => `${i.week}주차` },
          { id: 'label', header: '메뉴 이름', cell: (i) => i.label },
          {
            id: 'del',
            header: '',
            cell: (i) => (
              <Button
                variant="link"
                onClick={() => persist(items.filter((x) => x !== i), '삭제했습니다.')}
              >
                삭제
              </Button>
            ),
          },
        ]}
      />
    </SpaceBetween>
  );
};
