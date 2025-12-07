# Building and Deploying the Application

This document outlines the process for compiling the Astro + Svelte application into a static website, referencing the GitHub Action workflow.

## Local Compilation

To build the static website locally:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Fetch Data** (Optional but recommended for full content):
    This script fetches repository data from GitHub to populate the portfolio projects.
    ```bash
    npm run fetch-data
    ```

3.  **Build**:
    Compiles the application to the `dist/` directory.
    ```bash
    npm run build
    ```

4.  **Preview**:
    Serve the built static site locally to verify.
    ```bash
    npm run preview
    ```

## GitHub Actions Workflow

The application is automatically built and deployed via the GitHub Action defined in `.github/workflows/fetch-github-data.yml`.

### Workflow Steps

1.  **Checkout**: Checks out the repository code.
2.  **Setup Node.js**: Sets up Node.js environment (v20).
3.  **Install Dependencies**: Runs `npm ci` for a clean install.
4.  **Fetch GitHub Data**: Executes `.github/scripts/fetch-github-data.cjs` to generate `src/data/github-data.json`.
5.  **Build**: Runs `npm run build` to generate the static site in `dist/`.
6.  **Upload Artifact**: Uploads the `dist` directory.
7.  **Deploy**: Deploys the artifact to GitHub Pages.

### Reference: `.github/workflows/fetch-github-data.yml`

```yaml
name: Build and Deploy Portfolio

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: node .github/scripts/fetch-github-data.cjs
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - uses: actions/deploy-pages@v4
```

# Blog Post style

you must use the following style for writing posts :

post 1:
Multi-threading is always the wrong design
“We’ll just do that on a background thread”
uNetworking AB
uNetworking AB

Following
4 min read
·
Nov 28, 2023
409

Say what you want about Node.js. It sucks, a lot. But it was made with one very accurate observation: multithreading sucks even more.

A CPU with 4 cores doesn’t work like you are taught from entry level computer science. There is no “shared memory” with “random time access”. That’s a lie, it’s not how a CPU works. It’s not even how RAM works.

A CPU with 4 cores is going to have the capacity of executing 4 seconds of CPU-time per second. It does not matter how much “background idle threading” you do or don’t. The CPU doesn’t care. You always have 4 seconds of CPU-time per second. That’s an important concept to understand.

If you write a program in the design of Node.js — isolating a portion of the problem, pinning it to 1 thread on one CPU core, letting it access an isolated portion of RAM with no data sharing, then you have a design that is making as optimal use of CPU-time as possible. It is how you optimize for NUMA systems and CPU cache locality. Even a SMP system is going to perform better if treated as NUMA.

A CPU does not see RAM as some “shared random access memory”. Most of the time you aren’t even touching RAM at all. The CPU operates in an address space that is cached in SRAM in different layers of locality and size. As soon as you have multiple threads access the same memory, either you have cache coherence, threading bugs (which all companies have plenty of, even FAANG companies), or you need synchronization primitives that involve memory barriers that will cause shared cache lines to be sent back and forth as copies between the CPU cores, or caches to be committed to slow DRAM (the exact details depend on CPU).

In other words, isolating the problem at a high level, tackling it with single-threaded simple code is always going to be a lot faster than having a pool of threads bounce between cores, taking turn handling a shared pool of tasks. What I am saying is that designs like those in Golang, Scala and similar Actor designs are the least optimal for a modern CPU — even if the ones writing such code think of themselves as superior beings. Hint: they aren’t.

Become a member
Not only is multithreading detrimental for CPU-time usage efficiency, it also brings tons of complexity very few developers (really) understand. In fact, multithreading is such a leaky abstraction that you really must study your exact model of CPU to really understand how it works. So exposing threads to some high level [in terms of abstraction] developer is opening up pandoras box for seriously complex and hard to trigger bugs. These bugs do not belong in abstract business logic. You aren’t supposed to write business logic that depend on the details of your exact CPU.

Coming back to the idea of 4 seconds of CPU-time per second. The irony is that, since you are splitting the problem in a way that requires synchronization between cores, you are actually introducing more work to be executed in the same CPU-time budget. So you are spending more time on overhead due to synchronization, which does the opposite of what you probably hoped for — it makes your code even slower, not faster. Even if you think you don’t need synchronization because you are “clearly” mutating a different part of DRAM — you can still have complex bugs due to false sharing where a cache line spans across the addressed memory of two (“clearly isolated”) threads.

And since you have threads with their own stack, things like zero-copy are practically impossible between threads since, well they stand at different depths in the stack with different registers. Zero-copy, zero-allocation flows are possible and very easy in single threaded isolated code, duplicated as many times there are CPU-cores. So if you have 4 CPU cores, you duplicate your entire single threaded code 4 times. This will utilize all CPU-time efficiently, given that the bigger problem can be reasonably cut into isolated parts (which is incredibly easy if you have a significant flow of users). And if you don’t have such a flow of users, well then you don’t care about the performance aspect either way.

I’ve seen this mistake done at every possible company you can imagine — from unknown domestic ones to global FAANG ones. It’s always a matter of pride and thinking that, we, we can manage. We are better. No. It always ends with a wall of text of threading issues once you enable ThreadSanitizer and it always leads to poor CPU-time usage, complex getter functions with return by dynamic copy, and it blows the complexity out of proportions.

The best design is the one where complexity is kept minimal, and where locality is kept maximum. That is where you get to write code that is easy to understand without having these bottomless holes of mindbogglingly complex CPU-dependent memory barrier behaviors. These designs are the easiest to deploy and write. You just make your load balancer cut the problem in isolated sections and spawn as many threads or processes of your entire single threaded program as needed.

Again, say what you want about Node.js, but it does have this thing right. Especially in comparison with legacy languages like C, Java, C++ where threading is “everything goes” and all kinds of projects do all kinds of crazy threading (and most of them are incredibly error prone). Rust is better here, but still causes the same overhead as discussed above. So while Rust is easier to get bug-free, it still becomes a bad solution.

I hear so often — “just throw it on a thread and forget about it”. That is simply the worst use of threading imaginable. You are adding complexity and overhead by making multiple CPU cores cause invalidation of their caches. This thinking often leads to having 30-something threads just do their own thing, sharing inputs and outputs via some shared object. It’s terrible in terms of usage of CPU-time and like playing with a loaded revolver.

Rant: over.

post 2:
Inkjet printers are absolute scams
How to thrive in a scammer’s market and print for pennies
uNetworking AB
uNetworking AB

Following
3 min read
·
Aug 22, 2023
33






I bought my printer second hand for $20 and I’ve now printed 8000 pages of flawless text for the cost of maybe $40 in total. There are many layers of scams in the inkjet business and they are not all obvious. Here are my findings for Canon printers.

Rule #1 — If you ever bought a cartridge of ink, you have been scammed. These $50 cartridges are pure, raw, scams. The markup is 99% and you can buy liters of pigmented ink on Amazon for close to nothing. A liter of ink will last you two ice ages. Never buy a cartridge — you shouldn’t have to. Ever. If you believe that Canon has better ink than what you can buy on Amazon then you are simply experiencing psychological denial as a coping mechanism for past trauma. My printed text is absolutely flawless.

Become a member
Rule #2 — Don’t eject your cartridge when you refill it. Even if it is perfectly possible to refill a cartridge with ink, Canon printers will track every time you eject the cartridge and after 4–5 times it will fry the electronics of the cartridge, producing what looks to be “clogged nozzles”. This is a software scam, the cartridge is not actually clogged but rather it has been fried by software to trick you into buying a new one. I realized this after having suspicious failures right after a refill. Once I started refilling the cartridge while still in the printer, it lasted forever. I’ve printed thousands of pages on this single cartridge by now and it still prints a perfect test pattern.

Rule #3— Inkjet printers have a programmed-in fixed number of pages it can print before it goes into brick mode and requires a hefty “service fee” to unbrick. During this mode, the printer is a literal brick. This is a software scam. They don’t service anything, except for resetting the software counter. You can do this yourself, there are leaked Canon Service Tool programs you can perform this “service” with at home. Your printer will go from totally bricked to fully functioning at the click of a button. My printer went into brick mode at around 4000 pages and I’ve printed another 4000 perfect pages after simply resetting this software scam.

Rule #4 — Don’t buy the printers that have MegaTank, or EcoTanks. These printers have another built-in brick mode similar to #3 but different. There are two software counters in Canon printers; one tracks how many pages you have printed and will brick the printer if too many. The other tracks how much ink has been “flushed” to a certain cotton pad. The software counter that tracks how much ink has been flushed is what is going to get you when you buy MegaTank, EcoTank kind of printers. These printers have thin tubes that clog up easily unless you “flush” them with ink. The problem is that, when you do so, the software counter will reach brick mode very quickly. So you just end up bricking your entire printer that way. Just buy a normal printer and refill the cartridges with a syringe. That’s most reliable and cheap. These printers are very cheap second hand, since people just give up on them.

Just a quick rant from me, summarizing my findings. These printers are mechanically very reliable and environmentally friendly, yet they come armed to the teeth with an armada of software lock-outs and programmed-in scam modes.


post 3:

Multithreading is Hard (and You’re Probably Doing It Wrong)
uNetworking AB
uNetworking AB

Following
3 min read
·
Feb 3, 2025
86


3





I’ve never encountered a company that consistently does multithreading correctly. You might think that big, well-known Silicon Valley companies have it all figured out, but they make the same common mistakes as everyone else. Worse, they often miss these mistakes by not using ThreadSanitizer.

Multithreading is a textbook example of the Dunning-Kruger effect — you learn the basics, feel confident, and assume you’ve mastered it. But in reality, you’ve likely missed crucial details.

Use ThreadSanitizer Religiously
Skipping ThreadSanitizer is a slippery slope that leads to disaster. If you think, “False positives don’t matter,” you’ve already lost. There are no false positives if you do it correctly. Your application should be entirely free of any warnings.

Understand the Importance of Memory Barriers
Most developers know what a mutex is and how it orders operations across threads. However, few understand the memory barrier it provides, and even fewer understand how it relates to the underlying atomic variable.

A basic mutex is implemented like this:

#include <atomic>

class SimpleMutex {
    std::atomic<bool> locked = {false};
public:
    void lock() {
        while (locked.exchange(true, std::memory_order_acquire)) {
            // Busy-wait until it becomes false
        }
    }
    
    void unlock() {
        locked.store(false, std::memory_order_release);
    }
};
To understand a mutex, you must understand atomics and their operations using load(acquire) and store(release).

Why Are Memory Barriers Important?
CPUs will not read from or write to RAM unless necessary — they first use per-core SRAM caches. This means that if thread 1 modifies a variable, it might not be immediately visible to thread 2, even if the two are temporally synchronized (such as via sleep). To properly propagate changes across threads, you need:

A load/acquire operation on the same atomic address in the receiving thread.
A store/release operation on the same atomic address in the writing thread.
The Address of an Atomic Defines Its Synchronization Universe
A mutex (and therefore any atomic variable) establishes its own isolated synchronization universe, or “communication channel”. To safely propagate data from one thread to another:

The writing thread must wrap its write operation in a store(release) on the same atomic variable.
The reading thread must perform a load(acquire) on that same atomic variable.
Otherwise, the data may be stale, missing, or corrupt.

The Most Common Multithreading Mistake
Many developers correctly use a mutex when writing data, but fail to apply the same synchronization when reading it. This misunderstanding most likely comes from the idea that synchronization uses RAM as central stage of data exchange. As in, you synchronize to “flush” cache into RAM. So it naturally feels like a two step operation; write & read. And therefore it feels like reading the data is a separate step. It’s not. This is the wrong mental model.

Become a member
Synchronization is not about flushing cache to RAM, in fact RAM is rarely even touched. CPUs directly synchronize with each other, without using RAM. And when you think about it like this, it makes a lot of sense that you must synchronize your reading part as you synchronize your writing part. Because both threads come together to propagate their caches (there is no middle man such as the RAM). You are synchronizing the local SRAM cache of one CPU directly with another CPU. And for this you must use the same mutex (or atomic). The mutex literally is your communication channel in which the data exchange is guaranteed.

Always ensure that reading shared data follows the same locking strategy as writing it.

Conclusion
If you take away only a few things from this:

Always use ThreadSanitizer — there are no acceptable warnings.
Memory barriers matter — understand how load(acquire) and store(release) work.
A mutex does more than synchronize time — it synchronizes memory.
Reading shared data requires a mutex just as much as writing does.
Mastering multithreading isn’t just about avoiding race conditions — it’s about understanding memory models, atomic operations, and synchronization universes. If you ignore these principles, your code may seem to work — until it doesn’t.

