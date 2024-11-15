export const readPassword = async () => {
  return new Promise((resolve) => {
    process.stdout.write("Enter your password:");
    process.stdin.once("data", (data) => {
      const input = data.toString().trim();

      process.stdout.write("\x1b[FEnter your password:");
      for (let index = 0; index < input.length; index++) {
        process.stdout.write("*");
      }
      process.stdout.write("\n");
      resolve(input);
    });
  });
};
