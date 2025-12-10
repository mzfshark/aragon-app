import dynamic from 'next/dynamic';

export const UserDialog = dynamic(
	() => import(/* webpackChunkName: "userDialog" */ './userDialog').then((mod) => mod.UserDialog),
	{ ssr: false },
);
export type { IUserDialogProps } from './userDialog';
