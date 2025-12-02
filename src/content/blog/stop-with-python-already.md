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

A simple benchmark—a bubble sort on a $10,000$ array of $\text{float}32$ (fixed, randomly pre-generated)—shows how Go simply outperforms the others in compute-heavy scenarios. The bubblesort is so simple that JavaScript's V8 likely compiles it to similar assembly as Go, yet the results speak for themselves.

#### CPU-Heavy Workload Benchmark (Bubble Sort - Compiled Binary)

| Benchmark | Command | Mean Time (± σ) |
| :--- | :--- | :--- |
| **Go** | `./bubblesort` | $30.6 \text{ ms} \pm 1.6 \text{ ms}$ |
| **Node.js** | `node bubblesort.js` | $64.6 \text{ ms} \pm 2.5 \text{ ms}$ |
| **Node.js (minified)** | `node bubblesort.min.js` | $64.1 \text{ ms} \pm 3.1 \text{ ms}$ |
| **Python** | `python3 bubblesort.py` | $1.897 \text{ s} \pm 0.014 \text{ s}$ |

**Summary:** Go ran **2.1x** faster than Node.js and **62x** faster than Python.

### Cold Build: Go Still Competitive

"But what about compilation time?" you might ask. Let's include a **cold build** scenario—deleting the binary before each run—to measure the true cost of Go's compilation step against interpreted languages:

#### Cold Build Benchmark (Bubble Sort - Including Compilation)

| Benchmark | Command | Mean Time (± σ) |
| :--- | :--- | :--- |
| **Go** | `go build && ./bubblesort` | $77.5 \text{ ms} \pm 3.6 \text{ ms}$ |
| **Node.js** | `node bubblesort.js` | $63.3 \text{ ms} \pm 1.8 \text{ ms}$ |
| **Node.js (bundled)** | `npx esbuild ... && node bubblesort.min.js` | $169.3 \text{ ms} \pm 2.9 \text{ ms}$ |
| **Python** | `python3 bubblesort.py` | $1.933 \text{ s} \pm 0.035 \text{ s}$ |

Node.js direct execution (plain JavaScript, no TypeScript) beats Go by a small margin. However, Go **still outperforms the typical Node workflow** that includes bundling—and absolutely demolishes Python. This means for any compute-heavy project—CI scripts, data processing, tooling—Go remains a superior choice.

## CLI Applications: The Real-World Test

You might ask, "What about typical I/O-bound applications?" The following benchmarks compare a CLI application using common argparser and YAML parsing libraries—representative of real-world tooling.

#### CLI Benchmark (Compiled Binary)

| Benchmark | Command | Mean Time (± σ) |
| :--- | :--- | :--- |
| **Go** | `./rectangle test.yaml` | $1.1 \text{ ms} \pm 0.1 \text{ ms}$ |
| **Node.js (minified)** | `node rectangle.min.js test.yaml` | $19.6 \text{ ms} \pm 1.1 \text{ ms}$ |
| **Python** | `python3 rectangle.py test.yaml` | $19.9 \text{ ms} \pm 1.5 \text{ ms}$ |
| **Node.js** | `node rectangle.js test.yaml` | $23.2 \text{ ms} \pm 2.1 \text{ ms}$ |

**Summary:** Go ran **17-20x** faster than all interpreted alternatives. Despite claims of I/O bottlenecks leveling the playing field, Go dominates—likely due to both library quality and interpreter initialization overhead exceeding the actual workload.

#### CLI Cold Build Benchmark (Including Compilation)

| Benchmark | Command | Mean Time (± σ) |
| :--- | :--- | :--- |
| **Python** | `python3 rectangle.py test.yaml` | $19.6 \text{ ms} \pm 1.2 \text{ ms}$ |
| **Node.js** | `node rectangle.js test.yaml` | $24.1 \text{ ms} \pm 2.7 \text{ ms}$ |
| **Go** | `go build && ./rectangle test.yaml` | $107.1 \text{ ms} \pm 4.9 \text{ ms}$ |
| **Node.js (bundled)** | `npx esbuild ... && node rectangle.min.js test.yaml` | $128.3 \text{ ms} \pm 2.7 \text{ ms}$ |

In this worst-case scenario (cold build for a trivial workload), Python wins. Go's compilation overhead shows—yet it remains decent and still beats the typical Node.js bundling workflow.

#### CLI Hot Cache Benchmark (go run)

| Benchmark | Command | Mean Time (± σ) |
| :--- | :--- | :--- |
| **Python** | `python3 rectangle.py test.yaml` | $20.2 \text{ ms} \pm 2.0 \text{ ms}$ |
| **Node.js** | `node rectangle.js test.yaml` | $23.7 \text{ ms} \pm 1.4 \text{ ms}$ |
| **Go** | `go run rectangle.go test.yaml` | $53.4 \text{ ms} \pm 13.6 \text{ ms}$ |
| **Node.js (bundled)** | `npx esbuild ... && node rectangle.min.js test.yaml` | $127.0 \text{ ms} \pm 2.2 \text{ ms}$ |

In an interactive exploration scenario (using `go run` with cached build artifacts), Go closes the gap with interpreted languages—running at **2.6x** Python's time rather than **5.5x** in cold builds.

### The Verdict

The numbers are undeniable. The insistence on using Python or Node for everything is a fantasy rooted in convenience, not performance or maintainability. While Go might not be C++ or Rust, it provides a crucial and pragmatic solution that interpreted languages cannot touch—especially in production where compiled binaries dominate.
