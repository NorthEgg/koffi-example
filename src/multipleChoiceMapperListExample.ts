import type {
  HANDLE,
  LPCSTR,
  LPCWSTR,
  MultipleChoiceMapper,
  MultipleChoiceMapperList,
  MultipleChoiceMapperSet,
  POINTER_64,
} from "node_modules/win32-def/dist/index.d.cts";

// 以GetClassInfoExW函数为例，第二个参数有两种类型，它的参数是：
// BOOL GetClassInfoExW(
//   [in]  HANDLE hModule,
//   [in]  LPCTSTR lpClassName, 这个参数有两种类型，一种是string，一种是Buffer
//   [out] LPWNDCLASSEXW lpWndClass
// );
const GetClassInfoExW_mapper: MultipleChoiceMapper<
  [HANDLE, LPCWSTR, POINTER_64] | [HANDLE, LPCSTR, POINTER_64],
  ["HANDLE", "LPCWSTR", "LPWNDCLASSEXW"] | ["HANDLE", "LPCSTR", "LPWNDCLASSEXW"]
> = (
  fnName,
  /** 实参 */
  runtimeArgs,
  /** dllFuncs 中定义的函数参数及返回值类型 */
  defParamsArray
) => {
  // 对指定函数进行处理
  if (fnName !== "函数名") {
    return;
  }
  // 取出实参第二个，即需要判断的实际入参
  const lpszClass = runtimeArgs[1];

  for (const row of defParamsArray) {
    // assert(Array.isArray(row));
    // 取出定义的第二个参数，即 load 函数的配置项 dllFuncs 中定义的函数参数及返回值类型
    const defArg = row[1];

    // 双重判断，先判断实参类型，再判断定义的参数类型，保证两者都能匹配上
    switch (typeof lpszClass) {
      case "string": {
        if (defArg === "LPCWSTR") {
          return row;
        }
        break;
      }

      case "object": {
        // assert(lpszClass instanceof Buffer, "Invalid lpszClass type, must Buffer if object");
        if (defArg === "LPCSTR") {
          return row;
        }
        break;
      }

      default:
        throw new Error(`Invalid lpszClass type: ${typeof lpszClass}`);
    }
  }
  // return [] // will throw Error
};

export const multipleChoiceMapperSet: MultipleChoiceMapperSet = new Set();
multipleChoiceMapperSet.add(GetClassInfoExW_mapper);

export const multipleChoiceMapperList: MultipleChoiceMapperList = new Map();
multipleChoiceMapperList.set("函数名", multipleChoiceMapperSet);

// 两种方式使用

// 加载dll时定义
// const user32 = load({
//   dll: "user32.dll",
//   dllFuncs: defWin32,
//   multipleChoiceMapperList: multipleChoiceMapperList,
// });

// 加载完毕后定义
// const user32 = load({
//   dll: "user32.dll",
//   dllFuncs: defWin32,
// });
// user32.updateMultipleChoiceMapper({ mapperList: multipleChoiceMapperList });
