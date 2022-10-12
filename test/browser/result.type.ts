type GetData = {
	path: string;
	method: string;
	params: Record<string, string>;
};
type PostData = {
	path: string;
	method: string;
	params: Record<string, string>;
	data: Record<string, string>;
};
export type Result<T = string> = {
	code: number;
	msg: string;
	data: T extends string ? GetData : PostData;
};
