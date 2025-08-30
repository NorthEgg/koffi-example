`koffi`​ 、`win32-def`​库的使用例子

#### `GetNetworkParams.ts`​：获取当前设备网络配置(入门版)

##### 两种加载方式

1. 使用 `koffi`​ [Koffi官网](https://koffi.dev/)
2. 使用 `win32-def`​

    这是基于 `koffi`​ 的封装 [waitingsong/node-win32-api: win32 api](https://github.com/waitingsong/node-win32-api)

##### 具有以下使用例子

1. 类型别名
2. 创建指定长度char
3. 创建结构体
4. out类型的创建

### `WriteProcessMemory.ts`​：根据进程名获取句柄读写内存(进阶版)

以植物大战僵尸为例

使用 `koffi`​ 声明类型别名和创建结构体。库的加载及函数的调用使用 `win32-def`​ 获得定义好的一些类型申明以及更好的函数类型提示。

##### 具有以下使用例子

1. 根据进程名获取进程句柄
2. 进程模块地址获取
3. 结构体的初始化、修改结构体数据、将初始化修改的数据重新写入结构体
4. 偏移地址的计算
5. 内存读写
6. `_Inout_`​ 类型的使用

视频 https://github.com/996581176/koffi-example/tree/main/README

#### 相关文档
- [Windows Api documentation](https://msdn.microsoft.com/en-us/library/windows/desktop/ff468919%28v=vs.85%29.aspx)
- [Windows Data Types](https://msdn.microsoft.com/en-us/library/windows/desktop/aa383751#DWORD)
- [System Error Codes](https://msdn.microsoft.com/en-us/library/windows/desktop/ms681381%28v=vs.85%29.aspx)