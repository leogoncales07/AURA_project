
import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import readline from 'readline';

dotenv.config();

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    magenta: "\x1b[35m",
    red: "\x1b[31m"
};

class DevTeam {
    constructor(modelName = "gemini-pro") {
        this.llm = new ChatGoogleGenerativeAI({
            modelName: modelName,
            temperature: 0.7,
            apiKey: process.env.G_KEY
        });

        // --- Prompts ---

        // Agent 1: Coder
        this.coderPrompt = ChatPromptTemplate.fromMessages([
            ["system", "You are an expert Python and React Native Developer called 'DevCoder'. " +
                "Your goal is to write clean, efficient, and secure code based on user requirements. " +
                "Always return the full code implementation."],
            ["user", "Task: {task}\n\nExisting Code / Context (if any): {context}"]
        ]);

        // Agent 2: Reviewer
        this.reviewerPrompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a Senior Software Architect and Auditor called 'DevReviewer'. " +
                "Your goal is to review code for bugs, security vulnerabilities, and style issues. " +
                "If the code is good, approve it. If not, list specific improvements required. " +
                "Be strict but constructive."],
            ["user", "Review the following code:\n```\n{code}\n```\n\nIs this code ready for production? If not, what needs to be fixed?"]
        ]);
    }

    async writeCode(task, context = "") {
        console.log(`${colors.cyan}[DevCoder] Writing code for task: ${task}...${colors.reset}`);
        const chain = this.coderPrompt.pipe(this.llm);
        const response = await chain.invoke({ task, context });
        return response.content;
    }

    async reviewCode(code) {
        console.log(`${colors.yellow}[DevReviewer] Reviewing code...${colors.reset}`);
        const chain = this.reviewerPrompt.pipe(this.llm);
        const response = await chain.invoke({ code });
        return response.content;
    }

    async collaborate(task, maxIterations = 2) {
        console.log(`${colors.green}Starting Collaboration Task: ${task}\n${'='.repeat(50)}${colors.reset}`);

        // Step 1: Initial Draft
        let currentCode = await this.writeCode(task);
        console.log(`\n${colors.cyan}[DevCoder] Draft generated.\n${colors.reset}`);

        for (let i = 0; i < maxIterations; i++) {
            console.log(`${colors.magenta}--- Iteration ${i + 1} ---${colors.reset}`);

            // Step 2: Review
            const reviewFeedback = await this.reviewCode(currentCode);
            console.log(`\n${colors.yellow}[DevReviewer] Feedback:\n${reviewFeedback}\n${colors.reset}`);

            // Simple heuristic to check approval
            // Note: reviewFeedback might be an object if using structured output, but here it's string content
            const feedbackText = typeof reviewFeedback === 'string' ? reviewFeedback : JSON.stringify(reviewFeedback);

            if (feedbackText.toUpperCase().includes("APPROVE") && feedbackText.length < 100) {
                console.log(`${colors.green}[DevTeam] Code Approved!${colors.reset}`);
                break;
            }

            // Step 3: Refine based on feedback
            console.log(`${colors.cyan}[DevCoder] Fixing code based on feedback...${colors.reset}`);
            const refineTask = `Original Task: ${task}\n\nReviewer Feedback: ${feedbackText}\n\nPlease rewrite the code to address these issues.`;
            currentCode = await this.writeCode(refineTask, currentCode);
        }

        console.log(`${colors.green}${'='.repeat(50)}\nFinal Code:\n${colors.reset}`);
        console.log(currentCode);
        return currentCode;
    }
}

// Main execution
async function main() {
    if (!process.env.G_KEY) {
        console.error(`${colors.red}ERROR: G_KEY not found in .env file.${colors.reset}`);
        console.log("Please create a .env file in the backend directory with your key.");
        process.exit(1);
    }

    const team = new DevTeam();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Enter a coding task for the agents: ", async (task) => {
        if (task) {
            await team.collaborate(task);
        }
        rl.close();
    });
}

main();
