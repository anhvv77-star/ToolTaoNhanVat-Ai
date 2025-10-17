import type { AspectRatio, PhoneBrandRatios } from './types';

export const PRODUCT_SERVICES: string[] = [
  'Nền tảng giáo dục VnnEdu.com',
  'Nền tảng quản lý doanh nghiệp (VDUP và iCavat)',
  'Nền tảng quản lý nhà hàng (Cup69.com)',
  'Các dịch vụ tại nhà (Giúp việc, Chăm sóc người già, Vệ sinh)',
  'Tất cả sản phẩm/dịch vụ'
];

export const STANDARD_ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Dọc (9:16)', value: '9:16' },
  { label: 'Ngang (16:9)', value: '16:9' },
  { label: 'Vuông (1:1)', value: '1:1' },
  { label: 'Cổ điển (4:3)', value: '4:3' },
];

export const PHONE_WALLPAPER_ASPECT_RATIOS: PhoneBrandRatios[] = [
  {
    brand: 'Apple',
    models: [
      { label: 'iPhone 15 Pro Max', value: '9:19.5' },
      { label: 'iPhone 15 Pro', value: '9:19.5' },
      { label: 'iPhone 15', value: '9:19.5' },
      { label: 'iPhone 14', value: '9:19.5' },
      { label: 'iPhone SE (2022)', value: '9:16' },
    ],
  },
  {
    brand: 'Samsung',
    models: [
      { label: 'Galaxy S24 Ultra', value: '9:19.5' },
      { label: 'Galaxy S24', value: '9:19.5' },
      { label: 'Galaxy S23 FE', value: '9:19.5' },
      { label: 'Galaxy A55', value: '9:19.5' },
      { label: 'Galaxy Z Flip 5', value: '9:22' },
    ],
  },
  {
    brand: 'Xiaomi',
    models: [
      { label: 'Xiaomi 14 Ultra', value: '9:20' },
      { label: 'Xiaomi 14', value: '9:20' },
      { label: 'Xiaomi 13T Pro', value: '9:20' },
      { label: 'Poco F6 Pro', value: '9:20' },
      { label: 'Poco X6 Pro', value: '9:20' },
    ],
  },
  {
    brand: 'Oppo',
    models: [
      { label: 'Find X7 Ultra', value: '9:20' },
      { label: 'Reno11 Pro', value: '9:20' },
      { label: 'Find N3 (Cover)', value: '9:20' },
      { label: 'A98', value: '9:20' },
      { label: 'Reno10', value: '9:20' },
    ],
  },
    {
    brand: 'Redmi',
    models: [
      { label: 'Note 13 Pro+', value: '9:20' },
      { label: 'Note 13 Pro', value: '9:20' },
      { label: 'K70 Pro', value: '9:20' },
      { label: '13C', value: '9:20' },
      { label: 'A3', value: '9:20.6' },
    ],
  },
];