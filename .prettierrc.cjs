module.exports = {
	printWidth: 120, // 换行字符串阈值
	tabWidth: 2, // 设置工具每一个水平缩进的空格数
	useTabs: false, // 是否使用tab缩进
	semi: true, // 句末是否加分号
	singleQuote: true, // 用单引号
	trailingComma: 'none', // 最后一个对象元素符加逗号
	bracketSpacing: true, // 对象字面量的大括号之间是否有空格
	jsxBracketSameLine: true, // jsx > 是否另取一行
	insertPragma: false, // 不需要自动在文件开头加入 @prettier
	endOfLine: 'lf', // 换行符使用 lf
	bracketSameLine: true, // 对象字面量的大括号是否另起一行
	arrowParens: 'avoid', // 箭头函数参数是否使用圆括号
	vueIndentScriptAndStyle: false, // vue文件中script和style标签的缩进
	singleAttributePerLine: true // 单个属性是否单独一行
};
