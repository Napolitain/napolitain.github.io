---
title: "The Fallacy of Easy Languages: Why Python and Node Aren't the Panacea"
description: ""
date: 2025-11-21
tags: ["go", "python", "nodejs"]
draft: false
---

## The Fallacy of Easy Languages: Why Python and Node Aren't the Panacea

Many in the development world constantly push for **Python** or **Node.js** for virtually everything, suggesting that using a "compiled" language, or, heaven forbid, attempting to optimize anything "prematurely" is the root of all evil. **What a farce\!**

This craze for "easiness" and the immediate availability of packages has directly led to the heavily bloated ecosystems of PyPI and NPM. This, in turn, has resulted in an overwhelming amount of **security issues** due to supply chain attacks and massive runtime costs (both memory and compute). Developer cost increases due to the reliance on extra tooling for linting and rule enforcement that isn't built into the languages themselves, and lengthy package installation times in CI/CD pipelines.

If you choose today to write a Node or Python project using their native tooling (npm or pip), it simply **won't be fast**. And the code? Slow, prone to bugs, and difficult to maintain.

### The Myth of Simplicity

Another farce is the claim that Python and Node are inherently easier to use than compiled languages.

  * **Python's Package Manager Nightmare:** If you want to solve the inherent problems of **Python** and `pip`, you need to use newer tooling like **`uv`**. While `uv` is undeniably awesome (precisely because it's built with a compiled language\!), now you have the burden of knowing the potential drawbacks of using an alternate package manager.

  * **Node's Module Mess:** The story is even worse with **Node.js** and `npm`. Developers must choose between **CJS** (CommonJS) and **ESM** (ECMAScript Modules). Switching between these standard often necessitates changing your code (e.g. `require` vs. `import`\!). A CJS library cannot load an ESM library, forcing developers to constantly be aware of module compatibility.

    Sometimes, libraries don't fully support either CJS or ESM, leading developers to **bundle** their entire application using tools like `esbuild` into a single JavaScript file to remove all `require` or `import` statements entirely. Of course, you should also **minify** your JS code for optimization, so I guess you still have a compilation phase after all.

    By the way, I haven't even mentioned **TypeScript** yet (which should be mandatory), and it itself also requires a compilation step. So your workflow look roughly like this :

    ```mermaid
    graph LR
    
    subgraph "Development Workflow"
        A[Code] --> B[npm install: Dependencies]
        B --> C[tsconfig.json: Configure TypeScript]
        C --> D[Run: ts-node / nodemon]
        D --> E[Iterate & Modify Code]
        E --> F[Development Complete]
    end

    subgraph "Production Workflow"
        F --> G[esbuild: Compile & Bundle]
        G --> H[dist/: Minified & Bundled Output]
        H --> I[Deploy: Upload / Push to Server]
        I --> J[Runtime: Node.js Execution]
    end
    ```

    Yeah, very simple indeed.

## The Go Horizon: A Pragmatic Middle Ground

On the horizon, there is **Go**. When compared to giants like **C++** or **Rust**, Go is a terrible compiled language: it’s slower, has bloated memory consumption, and a weak multithreading model (multiplexing OS threads to goroutines is suboptimal for CPU cache).

But compared to Python and Node? Go is infinitely **nicer to work with** for simple scripts. If a project is non-critical, requires strict, streamlined development, and yet allows for a fast pace, it should be in Go. The rest can be done in C++ or Rust.

### Go's Workflow Advantage

Go offers several distinct advantages:

1.  **Extremely Fast Compilation:** Go compiles so quickly that you can use the command `go run ./cmd/mycli`, and it *feels* like using Python. You could even alias `goo="go run"` if you desire a single command execution.
2.  **Superior Package Management:** **`go mod`** is a better package manager: fast, safer, and far more integrated with built-in linters and static analysis tools than either NPM or pip/uv.
3.  **Simple Workflow, Static Binary:** The workflow is simple: `code` $\rightarrow$ `go build ./cmd/mycli` $\rightarrow$ `done`. You get a static binary that is far less bloated, fast enough for most purposes, and decisively faster than Python.
4.  **High-Quality Standard Library:** While Go's standard library is weak in some areas, its quality is significantly higher in the aspects that matter most for modern development (e.g., `net/http`).

### Performance Benchmarks: Go vs. Interpreted Languages

A simple benchmark—a bubble sort on a $10,000$ array of $\text{float}32$ (fixed, randomly pre-generated)—shows how Go simply outperforms the others in short-runtime scenarios.

The max execution time for a single Go run is smaller than the max time for the others (avoiding a cache-miss scenario). This proves that even with a cold build and run, **Go is faster than interpreted languages in a scripting context**. If this is true for a short bubblesort, imagine the impact in CI/CD pipelines or microservices.

*(Note: Go may show CPU usage over $100\%$ by default because the runtime multiplexes, even if the application logic is single-threaded.)*

#### 🧪 CPU-Heavy Workload Benchmark (Bubble Sort)

| Benchmark | Command | Mean Time (± σ) |
| :--- | :--- | :--- |
| **Go** | `go run ./cmd/bubblesort/go` | $190.8 \text{ ms} \pm 8.1 \text{ ms}$ |
| **Node.js** | `node ./cmd/bubblesort/node/bubblesort.js` | $314.3 \text{ ms} \pm 19.9 \text{ ms}$ |
| **Python** | `python ./cmd/bubblesort/py/bubblesort.py` | $6.902 \text{ s} \pm 0.034 \text{ s}$ |

The results speak for themselves: **Go is dramatically faster** than both Node.js and Python for CPU-intensive tasks.

Furthermore, we can level the playing field by disabling Go's multithreading runtime (`GOMAXPROCS=1`). The results remain identical, with less CPU usage, reinforcing that Go's basic execution speed is superior.

```
time GOMAXPROCS=1 go run ./cmd/bubblesort/go
0.16s user 0.03s system 99% cpu 0.194 total
```

## ⚡ I/O Bound: The Final Nail in the Coffin

You might ask, "What about I/O?" The following benchmark compares a moderately I/O-bound application (CLI argument parsing + YAML file parsing).

#### 🗄️ I/O-Bound Workload Benchmark (CLI + YAML Parsing)

| Benchmark | Command | Mean Time ($\pm \sigma$) |
| :--- | :--- | :--- |
| **Go** | `go run -f ./../rectangle.yaml` | $77.4 \text{ ms} \pm 6.9 \text{ ms}$ |
| **Python** | `python ./python/main.py ../../rectangle.yaml` | $75.8 \text{ ms} \pm 6.4 \text{ ms}$ |
| **Node.js** | `node ./node/main.js -f ../../rectangle.yaml` | $124.7 \text{ ms} \pm 9.5 \text{ ms}$ |

This shows that Go is **not dramatically slower** than Python or Node.js for an I/O-bound CLI application, even *with* the compilation step included in the runtime. The code for this benchmark is not $1:1$, and they rely on packages of different qualities. While some Python packages are decent, the interpreted languages still don't gain a significant edge over a Go program that includes the compile/run step.

### The Ultimate Test: Compiled Binary

Of course, if we were to include a **pre-compiled binary** in the comparison, I can assure you there is only one winner.

#### 🏁 Compiled Binary Benchmark

| Benchmark | Command | Mean Time ($\pm \sigma$) |
| :--- | :--- | :--- |
| **Go (Compiled Binary)** | `./main -f ../../rectangle.yaml` | $4.8 \text{ ms} \pm 1.6 \text{ ms}$ |
| **Python** | `python ../python/main.py ../../rectangle.yaml` | $75.8 \text{ ms} \pm 6.4 \text{ ms}$ |
| **Node.js** | `node ./node/main.js -f ../../rectangle.yaml` | $124.7 \text{ ms} \pm 9.5 \text{ ms}$ |

**Summary:** The compiled Go binary ran $\mathbf{15.82}$ times faster than Python and $\mathbf{26.02}$ times faster than Node.js.

The numbers are undeniable. The insistence on using Python or Node for everything is a fantasy rooted in convenience, not performance or maintainability. While Go might not be C++ or Rust, it provides a crucial and pragmatic solution that interpreted languages cannot touch.
