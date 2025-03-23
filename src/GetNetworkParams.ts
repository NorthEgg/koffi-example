import koffi from "koffi";
import { load, CallingConvention } from "win32-def";

// 加载 Iphlpapi.dll
const iphlpapi = koffi.load("iphlpapi.dll");
// 类型别名
koffi.alias("DWORD", "uint32_t");
// 定义结构体
koffi.struct("IP_ADDR_STRING", {
  Next: "IP_ADDR_STRING *",
  // 创建指定长度char
  IpAddress: koffi.array("char", 16, "String"),
  IpMask: koffi.array("char", 16, "String"),
  // 基本类型中没有 DWORD ,只有创建完类型别名后才能使用 DWORD 类型
  Context: "DWORD",
});
const FIXED_INFO = koffi.struct("FIXED_INFO", {
  HostName: koffi.array("char", 132, "String"),
  DomainName: koffi.array("char", 132, "String"),
  CurrentDnsServer: "IP_ADDR_STRING *",
  DnsServerList: "IP_ADDR_STRING",
  NodeType: "uint",
  ScopeId: koffi.array("char", 260, "String"),
  EnableRouting: "uint",
  EnableProxy: "uint",
  EnableDns: "uint",
});

// win32-def 加载方式
const aa = load<{
  GetNetworkParams: (pFixedInfo: Buffer<ArrayBuffer>, pOutBufLen: number[]) => number; // 定义要使用的函数类型
}>({
  dll: "iphlpapi.dll", // 使用的dll库
  // 定义函数返回值以及入参类型
  dllFuncs: {
    GetNetworkParams: ["DWORD", ["_Out_ FIXED_INFO *", "ulong *"]],
  },
  // 指定调用的函数名
  usedFuncNames: ["GetNetworkParams"],
  // 调用方式
  convention: CallingConvention.Stdcall,
  // 是否自动创建结构体
  autoCreateStruct: false,
});

const bufferSize = koffi.sizeof("FIXED_INFO"); // 获取 FIXED_INFO 结构体的大小
const pFixedInfo = Buffer.alloc(bufferSize); // 分配一个指定大小的缓冲区

// koffi 加载方式
const qq = iphlpapi.func(CallingConvention.Stdcall, "GetNetworkParams", "DWORD", [
  koffi.out(koffi.pointer("FIXED_INFO")), // 参数为 FIXED_INFO 结构体指针。 out 类型需要使用这种方式创建 更多资料参考 https://koffi.dev/output
  "ulong *", // 基础类型指针
]);

// pFixedInfo 也可以使用一个空对象代替
// 传递基础类型指针使用 [] 包裹，如下面的 [bufferSize]
const q = aa.GetNetworkParams(pFixedInfo, [bufferSize]); // win32-def 加载方式调用
// const q = qq(pFixedInfo, [bufferSize]); // koffi 加载方式调用
