import styles from "./learningGuide.module.css";

export const LearningGuide = ({ title = "Learning Guide", children }) => (
  <div className={styles.guide}>
    <strong className={styles.guideTitle}>{title}</strong>
    <div className={styles.guideBody}>{children}</div>
  </div>
);
