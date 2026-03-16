import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

export async function getRepo(owner, repo) {
  const response = await connectors.proxy("github", `/repos/${owner}/${repo}`, {
    method: "GET",
  });
  return response.json();
}

export async function getRepoContents(owner, repo, path = "") {
  const response = await connectors.proxy("github", `/repos/${owner}/${repo}/contents/${path}`, {
    method: "GET",
  });
  return response.json();
}
