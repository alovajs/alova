import alovaError from './alovaError';

// 自定义断言函数，表达式为falseValue时抛出错误
export default function (expression: boolean, msg: string) {
	if (!expression) {
		throw alovaError(msg);
	}
}
