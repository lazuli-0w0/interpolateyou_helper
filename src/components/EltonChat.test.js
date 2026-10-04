import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EltonChat } from './EltonChat';
import { AppNavigation } from './AppNavigation';
import { createTranslator } from '../i18n';
const t = createTranslator('zh-Hant');
test('public product entry is named 與我對話', () => {
  const change = jest.fn();render(<AppNavigation view="home" onViewChange={change} t={t} />);
  fireEvent.click(screen.getByRole('button',{name:'產品'}));fireEvent.click(screen.getByRole('button',{name:/與我對話/}));
  expect(change).toHaveBeenCalledWith('product-elton');
});
test('public chat sends only visitor history and keeps draft on failure',async()=>{
  global.fetch=jest.fn().mockResolvedValueOnce({ok:true,json:async()=>({available:true})})
    .mockResolvedValueOnce({ok:false,json:async()=>({code:'busy'})})
    .mockResolvedValueOnce({ok:true,json:async()=>({reply:'實際的模型回應'})});
  render(<EltonChat t={t}/>);
  await screen.findByText('可以對話');
  fireEvent.change(screen.getByLabelText('有甚麼想和我說？'),{target:{value:'我想聊聊'}});
  fireEvent.click(screen.getByRole('button',{name:/傳送/}));await screen.findByRole('alert');
  expect(screen.getByLabelText('有甚麼想和我說？').value).toBe('我想聊聊');
  fireEvent.click(screen.getByRole('button',{name:/傳送/}));await screen.findByText('實際的模型回應');
  const submitted=JSON.parse(global.fetch.mock.calls[2][1].body);
  expect(submitted).toEqual({messages:[{role:'user',content:'我想聊聊'}]});
  await waitFor(()=>expect(screen.getByLabelText('有甚麼想和我說？').value).toBe(''));
  expect(screen.queryByText('Angel')).toBeNull();
});
