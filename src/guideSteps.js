export const guideSteps = [
  {
    title: "Welcome to Simulation",
    content:
      "Would you like a guided tour of the Adaptive Prediction and Equalization Lab?",
    type: "choice",
    targetId: "guideButton",
  },
  {
    title: "Instructions",
    content: "Review the lab objectives and theoretical background here.",
    highlight: "instructionPanel",
    preferredPlacement: "right",
  },
  {
    title: "1. Signal Setup",
    content:
      "Select an ECG dataset and set the signal duration, then generate the ECG signal.",
    highlight: "signalSetup",
    preferredPlacement: "left",
  },
  {
    title: "2. Generate ECG Signal",
    content:
      "Click 'Generate ECG Signal' to load the selected dataset into the simulation.",
    highlight: "generateButton",
    requiredAction: "GENERATE_SIGNAL",
    preferredPlacement: "left",
  },
  {
    title: "3. Add Noise",
    content:
      "Select one or more noise types (Baseline Wander, Powerline, EMG) and click 'Add Noise to Signal' to corrupt the ECG.",
    highlight: "noisePanel",
    preferredPlacement: "left",
  },
  {
    title: "4. Select Algorithm",
    content:
      "Choose LMS or RLS and a task mode (Equalization or Prediction) to configure the adaptive filter.",
    highlight: "algorithmSelector",
    requiredAction: "SELECT_ALGO",
    preferredPlacement: "left",
    isDropdown: true,
  },
  {
    title: "5. Algorithm Parameters",
    content:
      "Tune the filter order, step size (LMS) or forgetting factor (RLS), and number of samples to control filter behaviour.",
    highlight: "algoSetup",
    preferredPlacement: "left",
  },
  {
    title: "6. Apply Algorithm",
    content:
      "Click 'Apply Algorithm' to run the adaptive filter and observe the filtered ECG output.",
    highlight: "applyAlgoBtn",
    requiredAction: "RUN_ALGORITHM",
    preferredPlacement: "left",
  },
  {
    title: "7. Compute PSD",
    content:
      "Click 'Compute PSD' to view the Power Spectral Density of both the noisy and filtered signals side by side.",
    highlight: "algoRunActions",
    preferredPlacement: "left",
  },
  {
    title: "Lab Completed",
    content:
      "Excellent! You've explored adaptive filtering with LMS and RLS. Feel free to experiment with different parameters and datasets.",
    preferredPlacement: "center",
  },
];
