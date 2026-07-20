import { tavily as Tavily } from "@tavily/core"

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
})


export const searchInternet = async ({ query, topic = "general", timeRange }) => {
    const options = {
        maxResults: 5,
        max_results: 5,
        searchDepth: "advanced",
        search_depth: "advanced",
    }
    if (topic) {
        options.topic = topic;
    }
    if (timeRange) {
        options.time_range = timeRange;
        options.timeRange = timeRange;
    }
    const results = await tavily.search(query, options)


    return JSON.stringify(results)
}