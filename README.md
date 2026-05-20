# Experiment 3(b): Advanced Adaptive Filtering (LMS & RLS)

This project is a React-based web application that simulates and visualizes advanced adaptive filtering algorithms for Experiment 3(b). It natively runs sophisticated simulations on the client side, allowing users to compare the performance of LMS (Least Mean Squares) and RLS (Recursive Least Squares) algorithms in both Equalization and Prediction tasks.

## Datasets Used (ECG)

This experiment provides **three ECG datasets** placed in `public/`:
- `public/ecg100.csv`
- `public/ecg200.csv`
- `public/ecg300.csv`

### How the datasets are used and why
- **Selection**: Users can load these datasets to observe standard waveforms in the application interface.
- **Why they are included**: While the equalization and prediction algorithms generate synthetic sequences to mathematically demonstrate convergence, the ECG data provides a baseline real-world signal context for the simulation environment.

## Implemented Algorithms

Experiment 3(b) focuses on comparing two primary adaptive algorithms across two distinct applications.

### Algorithms
1. **LMS (Least Mean Squares)**: 
   - **How it works**: Updates filter weights iteratively based on the instantaneous gradient of the squared error. 
   - **Why we use it**: It is highly computationally efficient and simple to implement, though it typically requires more iterations to converge.
2. **RLS (Recursive Least Squares)**:
   - **How it works**: Updates filter weights by recursively minimizing a weighted linear least squares cost function relating to the input signals. It utilizes a correlation matrix inverse calculation at every step.
   - **Why we use it**: RLS offers significantly faster convergence and better tracking of time-varying signals compared to LMS, albeit at a higher computational cost.

### Applications (Tasks)
1. **Channel Equalization**:
   - **How it works**: The algorithm attempts to reverse the distortion introduced by a communication channel (modeled as a simple FIR filter). It receives a distorted signal and adapts its weights to reconstruct the original transmitted symbols.
   - **Why we use it**: It's a critical application in telecommunications to remove inter-symbol interference (ISI) and accurately decode received messages.
2. **Signal Prediction**:
   - **How it works**: The algorithm uses a history of past samples to predict the current/future sample of an Autoregressive (AR) process.
   - **Why we use it**: Signal prediction is widely used in speech encoding, economic forecasting, and noise cancellation. It demonstrates how an adaptive filter can learn the underlying structure of a correlated signal.

## Visualizations: What the Charts Explain

For every algorithm and task combination, the simulation generates detailed charts to visualize the mathematical processes:

1. **Original vs. Predicted/Equalized Signal:**
   - **What it shows**: An overlay of the raw signal and the signal output by the filter.
   - **What it explains**: Visually demonstrates the accuracy of the algorithm. If the predicted wave closely hugs the original wave, the filter is successfully anticipating the signal behavior based on past samples.

2. **MSE (Mean Square Error) vs. Iterations:**
   - **What it shows**: The squared error between the filter's output and the desired signal at every single sample step.
   - **What it explains**: This is the fundamental "learning curve" of the filter. A steep drop means the algorithm learns quickly. By comparing LMS and RLS, you will clearly see that RLS achieves a near-zero MSE almost instantly, whereas LMS slopes down gradually.

3. **Weight Convergence (Filter Taps):**
   - **What it shows**: A series of lines tracing the dynamic adjustment of every individual filter tap (weight) over time.
   - **What it explains**: Shows the internal mechanics of the adaptation. The weights start at zero and curve until they flatten out (converge). Fast convergence indicates a highly responsive algorithm, while noisy, jittery lines indicate instability or a step-size that is too large.

## Technologies Used
* **React & Vite**: Fast UI component architecture.
* **Chart.js**: High-performance, real-time charting for MSE and weight tracking.
* **PapaParse**: Client-side CSV data handling.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```
