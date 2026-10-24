import News from "../models/news.models.js";

const DEFAULT_NEWS_IMAGE =
    "https://res.cloudinary.com/dyxmtrlqg/image/upload/v1792822562/template-images/iv40i5ftwbxqtp7toy7r.jpg";

// Get single fetchPost by ID
const AddNews = async (data) => {
    try {
        const images = Array.isArray(data.images)
            ? data.images.filter((image) => typeof image === "string" && image.trim())
            : [];
        const responsedata = await News.create({
            ...data,
            images: images.length ? images : [DEFAULT_NEWS_IMAGE],
        });

        if (!responsedata) {
            throw new Error('video failed to add');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

const GetNews = async () => {
    try {
        const responsedata = await News.find();
        if (!responsedata) {
            throw new Error('User not found');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

const GetNewsCategories = async () => {
    return News.distinct("category", { isPublished: true });
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildNewsFilter = (category, search, isPublished) => {
    const filter = {};
    if (category) {
        filter.category = category;
    }
    if (typeof isPublished === "boolean") {
        filter.isPublished = isPublished;
    }
    if (search) {
        const searchPattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [
            { title: searchPattern },
            { shortDescription: searchPattern },
            { content: searchPattern },
            { category: searchPattern },
            { subCategory: searchPattern },
            { "author.name": searchPattern },
            { "source.name": searchPattern },
            { tags: searchPattern },
        ];
    }
    return filter;
};

const findNewsPage = async (filter, skip, limit) => {
    const items = await News.find(filter)
        .sort({ publishedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .lean();
    const hasMore = items.length > limit;

    if (hasMore) {
        items.pop();
    }

    return { items, hasMore };
};

const GetNewsByCategory = async (category, skip, limit, search) => {
    return findNewsPage(buildNewsFilter(category, search, true), skip, limit);
};

const GetAdminNewsCategories = async () => {
    return News.distinct("category");
};

const GetAdminNewsByCategory = async (category, skip, limit, search) => {
    return findNewsPage(buildNewsFilter(category, search), skip, limit);
};

const DeleteNews = async (data) => {
    try {

        const {id} = data;
        const responsedata = await News.deleteOne({_id:id});

        if (!responsedata) {
            throw new Error('User not found');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

// Update news
const UpdateNews = async (updateData) => {
    try {
        const {
            _id,
            title,
            slug,
            shortDescription,
            content,
            images,
            video,
            category,
            subCategory,
            tags,
            author,
            source,
            publishedAt,
            isPublished,
            views,
            seo,
        } = updateData;

        const news = await News.findById(_id);

        if (!news) {
            throw new Error('News not found');
        }

        // Update fields
        if (title) news.title = title;
        if (slug) news.slug = slug;
        if (shortDescription) news.shortDescription = shortDescription;
        if (content) news.content = content;
        if (images) news.images = images;
        if (video) {
            if (video.url) news.video.url = video.url;
            if (video.thumbnail) news.video.thumbnail = video.thumbnail;
        }
        if (category) news.category = category;
        if (subCategory !== undefined) news.subCategory = subCategory;
        if (tags) news.tags = tags;
        if (author) {
            if (author.name) news.author.name = author.name;
            if (author.profileImage) news.author.profileImage = author.profileImage;
        }
        if (source) {
            if (source.name) news.source.name = source.name;
            if (source.url) news.source.url = source.url;
        }
        if (publishedAt) news.publishedAt = publishedAt;
        if (isPublished !== undefined) news.isPublished = isPublished;
        if (views !== undefined) news.views = views;
        if (seo) {
            if (seo.metaTitle) news.seo.metaTitle = seo.metaTitle;
            if (seo.metaDescription) news.seo.metaDescription = seo.metaDescription;
            if (seo.keywords) news.seo.keywords = seo.keywords;
            if (seo.canonicalUrl) news.seo.canonicalUrl = seo.canonicalUrl;
        }

        await news.save();

        return news;
    } catch (error) {
        throw error;
    }
};




export {
    AddNews,
    UpdateNews,
    DeleteNews,
    GetNews,
    GetNewsCategories,
    GetNewsByCategory,
    GetAdminNewsCategories,
    GetAdminNewsByCategory,
};
