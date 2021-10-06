from handlers import Handlers

PROMPT = """
[g] -> print general system information
[c] -> print information about the CPU
[r] -> print RAM information
[k] -> print kitty-cats
[s] -> save system info to file
[l] -> load system info from file
[q] -> quit the application"""

try:
    while True:
        print(PROMPT)
        choice = input("Your choice: ").strip()  # get the first character
        choice = choice[0] if len(choice) > 0 else ' '
        handlers = Handlers()

        switch = {
            'g': handlers.general,
            'c': handlers.cpu_information,
            'r': handlers.ram_information,
            'k': handlers.kitty_cats,
            's': handlers.save,
            'l': handlers.load,
            'q': handlers.quit,
            'e': handlers.quit
        }
        print(switch.get(choice, Handlers.default)())
except InterruptedError:  # handle Ctrl^C and quit
    print("\nOh, you're leaving, bye!")
