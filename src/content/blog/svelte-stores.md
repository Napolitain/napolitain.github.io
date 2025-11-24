---
title: "Understanding Svelte Stores"
description: "A deep dive into state management with Svelte stores."
date: 2025-01-25
tags: ["svelte", "frontend", "javascript"]
draft: false
---

# Understanding Svelte Stores

Svelte stores are a powerful way to manage state...

## Writable Stores

```javascript
import { writable } from 'svelte/store';
export const count = writable(0);
```
