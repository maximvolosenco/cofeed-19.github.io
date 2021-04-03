import Head from "next/head";
import { useEffect, useState } from "react";
import RSSParser from "rss-parser";
import { PostLink } from "../components/PostLink";

import { NewFeedForm } from "../components/NewFeedForm";
import { STORAGE_PREFIX } from "../constants";

const rssParser = new RSSParser();

function allStorage(): FeedArchiveType {
  const archive: FeedArchiveType = {};

  const FWFStorageKeys = Object.keys(localStorage).filter((k) =>
    k.startsWith(STORAGE_PREFIX)
  );

  for (const key of Object.keys(localStorage)) {
    const item = localStorage.getItem(key);
    if (item) {
      archive[key] = JSON.parse(item);
    }
  }

  return archive;
}

interface Feed extends RSSParser.Output<RSSParser.Item> {
  old: Record<string, boolean>;
}

type FeedArchiveType = Record<string, Feed>;

export default function Home() {
  const [feedArchive, setFeedArchive] = useState<FeedArchiveType>({});

  async function onSubmit(newFeed: string): Promise<void> {
    try {
      const feed = await rssParser.parseURL(newFeed);
      if (!localStorage.getItem(newFeed)) {
        const feedToAdd: Feed = {
          ...feed,
          old: {},
        };
        localStorage.setItem(newFeed, JSON.stringify(feedToAdd));
      }
    } catch (e) {
      alert(newFeed + " does not allow CORS");
    }
  }

  function onLinkClick(feedUrl?: string, itemLink?: string) {
    if (!feedUrl || !itemLink) {
      return;
    }
    const rawFeed: string | null = localStorage.getItem(feedUrl);
    if (rawFeed) {
      const feed: Feed = JSON.parse(rawFeed);
      console.log(feed);

      feed.old[itemLink] = true;
      localStorage.setItem(feedUrl, JSON.stringify(feed));
    }
  }

  useEffect(() => {
    const storage = allStorage();
    setFeedArchive(storage);
    console.log({ storage });
  }, []);

  return (
    <div>
      <Head>
        <title>Free web feed</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <h1>Free web feed</h1>
        <p style={{ color: "red" }}>
          This app works only on the browser. Some web feeds are blocked by CORS
          policy.
        </p>
        <hr />
        <NewFeedForm onSubmit={onSubmit} />
        {Object.keys(feedArchive).map((feedKey) => {
          const feed = feedArchive[feedKey];
          return (
            <div key={feedKey}>
              <h2>{feed?.title}</h2>
              {feed?.items
                .filter((item) => item.link && !feed.old[item.link])
                .map((item) =>
                  item.title && item.link ? (
                    <PostLink
                      title={item.title}
                      link={item.link}
                      onClick={() => onLinkClick(feed.feedUrl, item.link)}
                    />
                  ) : null
                )}
              {Object.keys(feed.old).length ? (
                <details>
                  <summary>Visited from {feed?.title}</summary>
                  {feed?.items
                    .filter((item) => item.link && feed.old[item.link])
                    .map((item) =>
                      item.title && item.link ? (
                        <PostLink
                          title={item.title}
                          link={item.link}
                          onClick={() => onLinkClick(feed.feedUrl, item.link)}
                        />
                      ) : null
                    )}
                </details>
              ) : null}
            </div>
          );
        })}
      </main>

      <footer>
        <hr />© {new Date().getFullYear()}{" "}
        <a
          href="https://github.com/strdr4605/"
          rel="noopener noreferrer"
          target="_blank"
        >
          @strdr4605
        </a>
        .
      </footer>
    </div>
  );
}
