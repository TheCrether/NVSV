from time import sleep
from clear import clear
import platform
import uptime
from cpuinfo import get_cpu_info
import psutil


cat1 = """
      \`-"'"-'/
       } 6 6 {
      =.  Y  ,=
    (""-'***`-"")
     `-/     \-'
      (  )-(  )==='
       ""   ""
"""

cat2 = """
     .       .
     \`-"'"-'/
      } 6 6 {
     =.  Y  ,=
       /^^^\  .
      /     \  )
     (  )-(  )/
      ""   ""
"""


def sec_to_hours(seconds: float) -> str:
    if seconds is None:
        return ""

    minutes = int(seconds % 60)
    hours = int(seconds / 60 / 60)
    return f"{hours}h {minutes}min"


class Handlers:
    def general(self):
        def helper(x): return x if x != None or len(x) > 0 else "N/A"
        cpuinfo = get_cpu_info()
        memory = psutil.virtual_memory()
        ram = "{:.2f}GB/{:.2f}GB".format(round(memory.used / 1024 ** 3, 2),
                                         round(memory.total / 1024 ** 3, 2))

        return f"""
OS \t: {helper(platform.platform())}
CPU \t: {helper(cpuinfo["brand_raw"])}
RAM \t: {helper(ram)}
Hostname\t: {helper(platform.node())}
Architecture: {helper(cpuinfo["arch"])}
Uptime \t: {helper(sec_to_hours(uptime.uptime()))}"""

    def cpu_information(self):
        def helper(x): return x if x != None or len(x) > 0 else "N/A"
        cpuinfo = get_cpu_info()
        freq = psutil.cpu_freq()
        speed = "{:.1f}GHz / {:.1f}GHz / {:.1f}GHz".format(
            round(freq.min, 1), round(freq.current, 1), round(freq.max))

        return f"""
CPU Name \t: {helper(cpuinfo["brand_raw"])}
CPU Speed (min / cur / max): {speed}
CPU Usage \t: {helper(psutil.cpu_percent(interval=1))}%
Cores (Threads)\t: {helper(psutil.cpu_count(logical=False))} ({helper(psutil.cpu_count(logical=True))})"""

    def ram_information(self):
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        ram = "{:.2f}GB/{:.2f}GB".format(round(memory.used / 1024 ** 3, 2),
                                         round(memory.total / 1024 ** 3, 2))
        swap_str = "{:.2f}GB/{:.2f}GB".format(round(swap.used / 1024 ** 3, 2),
                                              round(swap.total / 1024 ** 3, 2))
        return f"""
RAM Usage \t: {ram}
Usage (%) \t: {memory.percent}%
Swap \t\t: {swap_str}"""

    def kitty_cats(self):
        amount = input("How many kitty cats do you want?\nInput: ")
        if len(amount) == 0:
            print("Invalid amount")
            return

        try:
            amount = int(amount)
        except:
            print("Invalid amount")
            return

        for i in range(0, amount):
            clear()
            if i % 2 == 0:
                print(cat1)
            else:
                print(cat2)
            sleep(0.5)

        return f"printed {amount} kitty cats"

    def quit(self):
        # this quits the application and the main catches it
        raise InterruptedError()

    def save(self) -> str:
        txt = self.general().strip() + "\n" + self.cpu_information() + \
            "\n" + self.ram_information()
        with open('info.txt', 'w') as f:
            f.write(txt)

        return "Wrote system information into info.txt"

    def load(self) -> str:
        try:
            with open("info.txt", "r") as f:
                txt = f.read()
        except:
            return "could not read info.txt"
        return "System information\n" + txt

    def default(self):
        print("This option is not valid")
