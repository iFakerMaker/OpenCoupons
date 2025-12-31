
export interface Coupon {
  id: string;
  code: string;
  description: string;
  store: string;
  upvotes: number;
  downvotes: number;
  createdAt: number;
  addedBy: string;
}

export interface StoreInfo {
  name: string;
  domain: string;
  logo: string;
}

export enum ViewMode {
  LIST = 'LIST',
  ADD = 'ADD',
  SUCCESS = 'SUCCESS',
  TASKS = 'TASKS'
}
