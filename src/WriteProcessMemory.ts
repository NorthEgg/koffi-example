import {
  CallingConvention,
  load,
  type _POINTER,
  type BOOLEAN,
  type DWORD,
  type HANDLE,
  type LPCVOID,
  type LPDWORD,
  type LPVOID,
  type PSIZE_T,
  type SIZE_T,
} from "win32-def";
import koffi from "koffi";

// 不透明类型使用 koffi.opaque() 创建
// 不透明指针（void *）类型使用 koffi.pointer("HANDLE", koffi.opaque()) 创建
const HANDLE = koffi.pointer("HANDLE", koffi.opaque());
koffi.alias("LPVOID", HANDLE);
koffi.alias("LPCVOID", HANDLE);
koffi.alias("HMODULE", HANDLE);
koffi.alias("LPCSTR", "const char *");
koffi.alias("SIZE_T", "uint");
koffi.alias("DWORD", "uint32");
koffi.alias("LPDWORD", "DWORD *");
koffi.struct("PROCESSENTRY32", {
  dwSize: "DWORD",
  cntUsage: "DWORD",
  th32ProcessID: "DWORD",
  th32DefaultHeapID: "ulong *",
  th32ModuleID: "DWORD",
  cntThreads: "DWORD",
  th32ParentProcessID: "DWORD",
  pcPriClassBase: "long",
  dwFlags: "DWORD",
  szExeFile: koffi.array("char", 260, "String"),
});
koffi.alias("LPPROCESSENTRY32", "PROCESSENTRY32 *");

const lib = load<{
  /**打开进程获取句柄
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/processthreadsapi/nf-processthreadsapi-openprocess
   */
  OpenProcess: (
    dwDesiredAccess: DWORD,
    bInheritHandle: BOOLEAN,
    dwProcessId: DWORD
  ) => HANDLE | null;
  /**读内存
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/memoryapi/nf-memoryapi-readprocessmemory
   */
  ReadProcessMemory: (
    hProcess: HANDLE,
    lpBaseAddress: LPCVOID,
    lpBuffer: _POINTER,
    nSize: SIZE_T,
    lpNumberOfBytesWritten: SIZE_T | null
  ) => BOOLEAN;
  /**写内存
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/memoryapi/nf-memoryapi-writeprocessmemory
   */
  WriteProcessMemory: (
    hProcess: HANDLE,
    lpBaseAddress: LPVOID,
    lpBuffer: _POINTER,
    nSize: SIZE_T,
    lpNumberOfBytesWritten: PSIZE_T | null
  ) => BOOLEAN;
  /**获取模块地址
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/psapi/nf-psapi-enumprocessmodulesex
   *
   * 如果 PSAPI_VERSION 为 2 或更大，则此函数在 Psapi.h 中定义为 K32EnumProcessModulesEx ，并在 Kernel32.lib 和 Kernel32.dll 中导出。
   *
   * 如果 PSAPI_VERSION 为 1，则此函数在 Psapi.h 中定义为 EnumProcessModulesEx ，并在 Psapi.lib 中导出，Psapi.dll 为调用 K32EnumProcessModulesEx 的包装器。
   */
  K32EnumProcessModulesEx: (
    hProcess: HANDLE,
    lphModule: _POINTER,
    cb: DWORD,
    lpcbNeeded: LPDWORD,
    dwFilterFlag: DWORD
  ) => BOOLEAN;
  /**获取指定进程以及这些进程使用的堆、模块和线程的快照
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/tlhelp32/nf-tlhelp32-createtoolhelp32snapshot
   */
  CreateToolhelp32Snapshot: (dwFlags: DWORD, th32ProcessID: DWORD) => HANDLE;
  /**检索有关系统快照中遇到的第一个进程的信息
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/tlhelp32/nf-tlhelp32-process32first
   */
  Process32First: (hSnapshot: HANDLE, lppe: object) => BOOLEAN;
  /**检索有关系统快照中记录的下一个进程的信息
   * @see https://learn.microsoft.com/zh-cn/windows/win32/api/tlhelp32/nf-tlhelp32-process32next
   */
  Process32Next: (hSnapshot: HANDLE, lppe: object) => BOOLEAN;
}>({
  dll: "Kernel32.dll",
  dllFuncs: {
    OpenProcess: ["HANDLE", ["DWORD", "bool", "DWORD"]],
    ReadProcessMemory: ["bool", ["HANDLE", "LPVOID", "_Out_ LPCVOID", "SIZE_T", "_Out_ SIZE_T *"]],
    WriteProcessMemory: ["bool", ["HANDLE", "LPVOID", "LPCVOID", "SIZE_T", "_Out_ SIZE_T *"]],
    K32EnumProcessModulesEx: [
      "bool",
      ["HANDLE", "_Out_ HMODULE *", "DWORD", "_Out_ LPDWORD", "DWORD"],
    ],
    CreateToolhelp32Snapshot: ["HANDLE", ["DWORD", "DWORD"]],
    Process32First: ["bool", ["HANDLE", "_Inout_ LPPROCESSENTRY32"]],
    Process32Next: ["bool", ["HANDLE", "_Out_ LPPROCESSENTRY32"]],
  },
  usedFuncNames: [
    "OpenProcess",
    "ReadProcessMemory",
    "WriteProcessMemory",
    "K32EnumProcessModulesEx",
    "CreateToolhelp32Snapshot",
    "Process32First",
    "Process32Next",
  ],
  // 是否自动创建结构体（没有内置结构体就不会成功，因此直接自己创建）
  autoCreateStruct: false,
  // 调用约定
  convention: CallingConvention.Stdcall,
  // 指定系统位数，不填写默认是 false 即当前系统位数
  // _WIN64,
  // 判断是否强制注册。若不强制，则尝试从缓存（LoaderCache）中获取已注册的函数映射。
  // forceRegister,
  /**处理Windows API调用中参数多态的映射器。需要自己实现实参与形参的匹配，然后作为参数传递给 multipleChoiceMapperList。
   * 例子见 src/multipleChoiceMapperListExample.ts
   */
  // multipleChoiceMapperList,
});

// -------------------------------------------根据进程名查找进程PID--------------------------------------------
const hSnapShot = lib.CreateToolhelp32Snapshot(0x00000002, 1);
// 初始化 PROCESSENTRY32
const PROCESSENTRY32 = koffi.alloc("PROCESSENTRY32", koffi.sizeof("PROCESSENTRY32"));
// 结构体对象转换为js对象
const PROCESSENTRY32Obj = koffi.decode(PROCESSENTRY32, "PROCESSENTRY32");
// 修改数据
PROCESSENTRY32Obj.dwSize = koffi.sizeof("PROCESSENTRY32");
// js对象写入结构体
koffi.encode(PROCESSENTRY32, "PROCESSENTRY32", PROCESSENTRY32Obj);

lib.Process32First(hSnapShot, PROCESSENTRY32);
let pid = 0;
do {
  lib.Process32Next(hSnapShot, PROCESSENTRY32);
  if (koffi.decode(PROCESSENTRY32, "PROCESSENTRY32").szExeFile === "PlantsVsZombies.exe") {
    pid = koffi.decode(PROCESSENTRY32, "PROCESSENTRY32").th32ProcessID;
    break;
  }
} while (pid === 0);

// -------------------------------------------根据PID获取进程句柄--------------------------------------------
const process = lib.OpenProcess(0xffff, false, pid);
if (process) {
  // -------------------------------------------获取exe模块地址--------------------------------------------
  const lphModule = koffi.alloc("HMODULE", 200);
  /** 记录在 lphModule 数组中存储所有模块句柄所需的字节数 */
  let lpcbNeeded = Buffer.alloc(4);
  lib.K32EnumProcessModulesEx(process, lphModule, koffi.sizeof("HMODULE") * 200, lpcbNeeded, 0x03);
  /** 进程模块地址列表 */
  const moduleAddredssList = koffi.decode(
    lphModule,
    "HMODULE",
    lpcbNeeded.readInt32LE() / koffi.sizeof("HMODULE")
  );
  /** exe进程模块地址 */
  const exeModuleAddress = koffi.address(moduleAddredssList[0]);

  // -------------------------------------------根据基址和偏移计算最终地址--------------------------------------------
  // PlantsVsZombies.exe+3794F8  868  178  4  5578
  const address = calcAddress(process, [
    exeModuleAddress + 0x3794f8n,
    0x868n,
    0x178n,
    0x4n,
    0x5578n,
  ]);

  // 写内存
  const buffer = Buffer.alloc(4);
  buffer.writeInt32LE(10000);
  const result = lib.WriteProcessMemory(process, address, buffer, 4, null);
  console.log(result);
}
/** 根据基址和偏移计算最终地址 */
function calcAddress(process: HANDLE, values: bigint[]) {
  const address: bigint = values.reduce((prev, curr, index) => {
    if (index === values.length - 1) {
      // 最后一个地址直接返回地址值
      return prev + curr;
    } else {
      // 计算偏移后的地址
      const value = Buffer.alloc(8);
      lib.ReadProcessMemory(process, prev + curr, value, 4, null);
      return value.readBigUint64LE();
    }
  }, 0n);
  return address;
}
