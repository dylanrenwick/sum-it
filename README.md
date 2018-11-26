# Sum-It

Sum-It is a mountain-range themed esoteric language, with a parser written in Node.js

## Running

Run with `node sum-it.js -f filename-goes-here`

## Writing

Code is stylized as ASCII art mountains, like so:

```
  /\
 /  \
/    \
```
Mountains are tokenized as an integer opcode, depending on their size (the number of characters beneath the surface of the mountain)  
In the example above, the mountain has a total size of `6`, counted as such:
```
  /\
 /##\
/####\
```

Any characters that do not directly make up the structure of the mountain's surface are ignored, and in most cases, slashes outside of mountains are fine too, however if they are too close to a base, peak or transition, they may confuse the tokenizer.

### Overlapping mountains

In the case of 2 overlapping mountains, the right mountain takes priority, and "slices" the left mountain. For example:
```
      /\
  /\ /  \
 /  /    \
/  /      \
```

This would be counted as a 4, then a 10, like so:
```
      /\
  /\ /@@\
 /##/@@@@\
/##/@@@@@@\
```

Note that, for golfing purposes, it is possible to slightly reduce bytecount by overlapping the last char of a mountain with the first char of the next mountain, with no change in functionality. For example:
```
 /\  /\
/##\/@@\
```
Can be slghtly shortened to:
```
 /\ /\
/##/@@\
```
As this does not actually change the "size" of either mountain, the functionality is still the same

## Opcode reference:
In this context, `n` refers to the next data value (See `Data values` above)
```
0 - No-Op
1 - Push n to the stack
2 - Sum n and the top item of the stack
    Monadic (Empty Stack) behaviour: Push n + n to the stack
3 - Subtract n from the top item of the stack
    Monadic (Empty Stack) behaviour: Push 0 to the stack
4 - Multiply n with the top item of the stack
    Monadic (Empty Stack) behaviour: Push n * n to the stack
5 - Divide the top item of the stack by n
    Monadic (Empty Stack) behaviour: Push 1 to the stack
6 - Pop from stack and print %127 as ASCII
7 - Modulo the top item of the stack with n
    Monadic (Empty Stack) behaviour: Push n to the stack
8 - Raise the top item of the stack to the power of n
    Monadic (Empty Stack) behaviour: Push n ** n to the stack
9 - No-Op
10 - Duplicate the top item of the stack
11 - No-Op
12 - Move the top item of the stack to the bottom of the stack
```
